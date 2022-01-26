package edu.iu.uits.lms.bulkremoveusers.controller;

import edu.iu.uits.lms.canvas.model.CanvasRole;
import edu.iu.uits.lms.canvas.model.Enrollment;
import edu.iu.uits.lms.canvas.model.Section;
import edu.iu.uits.lms.canvas.services.AccountService;
import edu.iu.uits.lms.canvas.services.CanvasService;
import edu.iu.uits.lms.canvas.services.CourseService;
import edu.iu.uits.lms.canvas.services.SectionService;
import edu.iu.uits.lms.iuonly.services.SudsServiceImpl;
import edu.iu.uits.lms.lti.LTIConstants;
import edu.iu.uits.lms.lti.controller.LtiAuthenticationTokenAwareController;
import edu.iu.uits.lms.lti.security.LtiAuthenticationToken;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.annotation.Secured;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.ModelAndView;

import javax.servlet.http.HttpServletRequest;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Controller
@RequestMapping("/app")
@Slf4j
public class BulkRemoveUsersController extends LtiAuthenticationTokenAwareController {

   @Autowired
   private AccountService accountService = null;

   @Autowired
   private CanvasService canvasService = null;

   @Autowired
   private CourseService courseService = null;

   @Autowired
   private SectionService sectionService = null;

   @Autowired
   private SudsServiceImpl sudsService = null;

   @RequestMapping("/index/{courseId}")
   @Secured(LTIConstants.INSTRUCTOR_AUTHORITY)
   public ModelAndView index(@PathVariable("courseId") String courseId, Model model, HttpServletRequest request) {
      log.debug("in /index");
      LtiAuthenticationToken token = getValidatedToken(courseId);
      model.addAttribute("courseId", courseId);

      // add a link to the People tool that is used in the success message alert
      String peopleToolUrl = canvasService.getBaseUrl() + "/courses/" + courseId + "/users";
      model.addAttribute("peopleToolUrl", peopleToolUrl);

      // get the sections in the course and establish lists to track SIS vs non-SIS
      List<Section> rawSectionList = courseService.getCourseSections(courseId);
      List<Section> sisSectionList = new ArrayList<>();
      List<Section> nonSisSectionList = new ArrayList<>();

      // the final, curated list of enrollments to display in the tool
      List<EnrollmentDisplay> finalEnrollmentList = new ArrayList<>();

      // loop through the sections
      for (Section section : rawSectionList) {
         // see if the section has a sis id
         if (section.getSis_section_id() != null && !section.getSis_section_id().isEmpty()) {
            // confirm if the sis id is an official SIS course
            if (sudsService.getSudsCourseBySiteId(section.getSis_section_id()) != null) {
               // confirmed this is in suds
               sisSectionList.add(section);
            } else if (sudsService.getSudsArchiveCourseBySiteId(section.getSis_section_id()) != null) {
               // confirmed this is in suds archive
               sisSectionList.add(section);
            } else {
               // not in either, so consider it a non-sis section
               nonSisSectionList.add(section);
            }
         } else {
            // no sis id, so non-sis section
            nonSisSectionList.add(section);
         }
      }

      // get the roleMap based on the course's accountId
      Map<String, String> roleMap = getCanvasRoleMap(courseService.getCourse(courseId).getAccountId());

      // Rules for being a valid enrollment to display for removal
      // 1. Can not be the current user
      // 2. sis section, must be a null sis_import_id for the user to be eligible for removal
      // 3. non-sis section, all enrollments eligible for removal

      // loop through SIS sections for eligible enrollments to be removed
      for (Section sisSection : sisSectionList) {

         List<Enrollment> sisSectionEnrollments = sectionService.getAllSectionEnrollmentsById(sisSection.getId());

         for (Enrollment enrollment : sisSectionEnrollments) {
            if (enrollment.getUser().getLoginId().equals(token.getPrincipal())) {
               // can't remove yourself, so move on!
               continue;
            } else if (enrollment.getUser().getSisImportId() == null) {
               // enrollment was not imported via SIS, so add them to the list!
               EnrollmentDisplay enrollmentDisplay = new EnrollmentDisplay();
               enrollmentDisplay.setEnrollmentId(enrollment.getId());
               enrollmentDisplay.setDisplayName(enrollment.getUser().getSortableName());
               enrollmentDisplay.setUsername(enrollment.getUser().getLoginId());
               enrollmentDisplay.setRole(roleMap.get(enrollment.getRole()));
               enrollmentDisplay.setBaseRole(enrollment.getType());
               enrollmentDisplay.setSectionName(sisSection.getName());
               finalEnrollmentList.add(enrollmentDisplay);
            }
         }
      }

      // loop through non-SIS sections for eligible enrollments to be removed
      for (Section nonSisSection : nonSisSectionList) {

         List<Enrollment> nonSisSectionEnrollments = sectionService.getAllSectionEnrollmentsById(nonSisSection.getId());

         for (Enrollment enrollment : nonSisSectionEnrollments) {
            if (enrollment.getUser().getLoginId().equals(token.getPrincipal())) {
               // can't remove yourself, so move on!
               continue;
            } else {
               // all non-sis are eligible, except yourself. Add it!
               EnrollmentDisplay enrollmentDisplay = new EnrollmentDisplay();
               enrollmentDisplay.setEnrollmentId(enrollment.getId());
               enrollmentDisplay.setDisplayName(enrollment.getUser().getSortableName());
               enrollmentDisplay.setUsername(enrollment.getUser().getLoginId());
               enrollmentDisplay.setRole(roleMap.get(enrollment.getRole()));
               enrollmentDisplay.setBaseRole(enrollment.getType());
               enrollmentDisplay.setSectionName(nonSisSection.getName());
               finalEnrollmentList.add(enrollmentDisplay);
            }
         }
      }

      // sort by name, then section!
      finalEnrollmentList = finalEnrollmentList.stream()
              .sorted(Comparator.comparing(EnrollmentDisplay::getDisplayName)
              .thenComparing(EnrollmentDisplay::getSectionName)).collect(Collectors.toList());

      // get a distinct list of roles
      List<String> distinctRoles = finalEnrollmentList.stream()
              .map(EnrollmentDisplay::getBaseRole)
              .distinct().collect(Collectors.toList());

      // using the distinct list of roles, determine which checkboxes will be disabled
      model.addAttribute("disableTeachers", !distinctRoles.contains("TeacherEnrollment"));
      model.addAttribute("disableStudents", !distinctRoles.contains("StudentEnrollment"));
      model.addAttribute("disableTAs", !distinctRoles.contains("TaEnrollment"));
      model.addAttribute("disableDesigners", !distinctRoles.contains("DesignerEnrollment"));
      model.addAttribute("disableObservers", !distinctRoles.contains("ObserverEnrollment"));

      // using this just for getting the roles and using them for an official count with the checkboxes at the top of the page
      List<String> listOfRoles = finalEnrollmentList.stream()
              .map(EnrollmentDisplay::getBaseRole)
              .collect(Collectors.toList());

      // count the amount of times each role occurs. This is used for checkboxes at the top of the page
      model.addAttribute("allUserCount", finalEnrollmentList.size());
      model.addAttribute("teacherCount", Collections.frequency(listOfRoles, "TeacherEnrollment"));
      model.addAttribute("studentCount", Collections.frequency(listOfRoles, "StudentEnrollment"));
      model.addAttribute("taCount", Collections.frequency(listOfRoles, "TaEnrollment"));
      model.addAttribute("designerCount", Collections.frequency(listOfRoles, "DesignerEnrollment"));
      model.addAttribute("observerCount", Collections.frequency(listOfRoles, "ObserverEnrollment"));

      // section for making a list of duplicate usernames. This is strictly used for the dialog box to give more precise information
      List<String> usernameList = finalEnrollmentList.stream()
              .map(EnrollmentDisplay::getUsername).collect(Collectors.toList());

      // if a name occurs more than once, then there's a dupe
      List<String> dupeUsernames = usernameList.stream()
              .filter(e -> Collections.frequency(usernameList, e) > 1)
              .distinct()
              .collect(Collectors.toList());

      // add the dupe usernames to model
      model.addAttribute("dupeUsernames", dupeUsernames);

      // add the enrollments
      model.addAttribute("finalEnrollmentList", finalEnrollmentList);

      return new ModelAndView("index");
   }

   @RequestMapping("/remove/{courseId}")
   @Secured(LTIConstants.INSTRUCTOR_AUTHORITY)
   public ModelAndView remove(@RequestParam("user") List<String> userValues, @PathVariable("courseId") String courseId, Model model, HttpServletRequest request) {
      log.debug("in /remove");
      LtiAuthenticationToken token = getValidatedToken(courseId);

      boolean errors = false;

      // do the deletes
      try {
         for (String enrollmentId : userValues) {
            Enrollment enrollment = courseService.deleteEnrollment(courseId, enrollmentId);
            if (enrollment == null || !"deleted".equals(enrollment.getEnrollmentState())) {
               errors = true;
            }
         }
      } catch (Exception e) {
         errors = true;
         log.error("Error deleting enrollment", e);
      }

      // set error or success status
      if (errors) {
         model.addAttribute("errors", true);
      } else {
         model.addAttribute("success", true);
      }

      return index(courseId, model, request);
   }

   private Map<String, String> getCanvasRoleMap(String accountId) {
      List<CanvasRole> canvasRoles = accountService.getRolesForAccount(accountId, true);
      log.debug("Roles: " + canvasRoles.size());

      return canvasRoles.stream().collect(Collectors.toMap(CanvasRole::getRole, CanvasRole::getLabel));
   }

   /**
    * Using this just to organize data to display in an easier way
    */
   @Data
   private class EnrollmentDisplay {
      private String enrollmentId;
      private String displayName;
      private String username;
      private String role;
      private String baseRole;
      private String sectionName;
   }
}
