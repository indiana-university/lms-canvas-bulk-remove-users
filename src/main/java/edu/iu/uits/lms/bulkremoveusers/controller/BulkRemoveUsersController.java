package edu.iu.uits.lms.bulkremoveusers.controller;

/*-
 * #%L
 * bulk-remove-users
 * %%
 * Copyright (C) 2022 Indiana University
 * %%
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted provided that the following conditions are met:
 * 
 * 1. Redistributions of source code must retain the above copyright notice, this
 *    list of conditions and the following disclaimer.
 * 
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the documentation
 *    and/or other materials provided with the distribution.
 * 
 * 3. Neither the name of the Indiana University nor the names of its contributors
 *    may be used to endorse or promote products derived from this software without
 *    specific prior written permission.
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
 * IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
 * INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING,
 * BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
 * LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE
 * OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED
 * OF THE POSSIBILITY OF SUCH DAMAGE.
 * #L%
 */

import edu.iu.uits.lms.canvas.helpers.EnrollmentHelper;
import edu.iu.uits.lms.canvas.model.CanvasRole;
import edu.iu.uits.lms.canvas.model.Enrollment;
import edu.iu.uits.lms.canvas.model.Section;
import edu.iu.uits.lms.canvas.services.AccountService;
import edu.iu.uits.lms.canvas.services.CanvasService;
import edu.iu.uits.lms.canvas.services.CourseService;
import edu.iu.uits.lms.canvas.services.SectionService;
import edu.iu.uits.lms.iuonly.services.SudsServiceImpl;
import edu.iu.uits.lms.lti.LTIConstants;
import edu.iu.uits.lms.lti.controller.OidcTokenAwareController;
import edu.iu.uits.lms.lti.service.OidcTokenUtils;
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
import uk.ac.ox.ctl.lti13.security.oauth2.client.lti.authentication.OidcAuthenticationToken;

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
public class BulkRemoveUsersController extends OidcTokenAwareController {

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

   @RequestMapping(value = "/accessDenied")
   public String accessDenied() {
      return "accessDenied";
   }

   @RequestMapping({"/loading", "/launch"})
   @Secured(LTIConstants.INSTRUCTOR_AUTHORITY)
   public String loading(Model model) {
      OidcAuthenticationToken token = getTokenWithoutContext();
      OidcTokenUtils oidcTokenUtils = new OidcTokenUtils(token);
      String courseId = oidcTokenUtils.getCourseId();
      model.addAttribute("courseId", courseId);
      model.addAttribute("hideFooter", true);
      return "loading";
   }

   @RequestMapping("/index/{courseId}")
   @Secured(LTIConstants.INSTRUCTOR_AUTHORITY)
   public ModelAndView index(@PathVariable("courseId") String courseId, Model model) {
      log.debug("in /index");
      OidcAuthenticationToken token = getValidatedToken(courseId);
      OidcTokenUtils oidcTokenUtils = new OidcTokenUtils(token);
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

      // States of the desired enrollments
      String[] states = {EnrollmentHelper.STATE.active.name(), EnrollmentHelper.STATE.invited.name()};

      // Rules for being a valid enrollment to display for removal
      // 1. Can not be the current user
      // 2. Can not be a StudentViewEnrollment
      // 3. sis section: Must be a null sis_import_id in the enrollment for the user to be eligible for removal
      // 4. non-sis section: all enrollments eligible for removal

      // loop through SIS sections for eligible enrollments to be removed
      for (Section sisSection : sisSectionList) {

         List<Enrollment> sisSectionEnrollments = sectionService.getAllSectionEnrollmentsByIdAndState(sisSection.getId(), states);

         for (Enrollment enrollment : sisSectionEnrollments) {
            if (enrollment.getUser().getLoginId().equals(oidcTokenUtils.getUserLoginId())) {
               // can't remove yourself, so move on!
               continue;
            } else if (enrollment.getSisImportId() == null) {
               // enrollment was not imported via SIS, so add them to the list!
               if (EnrollmentHelper.TYPE_STUDENT_VIEW.equals(enrollment.getType())) {
                  // we do not care about this student view enrollment type, so skip it
                  continue;
               }
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

         List<Enrollment> nonSisSectionEnrollments = sectionService.getAllSectionEnrollmentsByIdAndState(nonSisSection.getId(), states);

         for (Enrollment enrollment : nonSisSectionEnrollments) {
            if (enrollment.getUser().getLoginId().equals(oidcTokenUtils.getUserLoginId())) {
               // can't remove yourself, so move on!
               continue;
            } else {
               // all non-sis are eligible, except yourself. Add it!
               if (EnrollmentHelper.TYPE_STUDENT_VIEW.equals(enrollment.getType())) {
                  // we do not care about this student view enrollment type, so skip it
                  continue;
               }
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
      model.addAttribute("disableTeachers", !distinctRoles.contains(EnrollmentHelper.TYPE_TEACHER));
      model.addAttribute("disableStudents", !distinctRoles.contains(EnrollmentHelper.TYPE_STUDENT));
      model.addAttribute("disableTAs", !distinctRoles.contains(EnrollmentHelper.TYPE_TA));
      model.addAttribute("disableDesigners", !distinctRoles.contains(EnrollmentHelper.TYPE_DESIGNER));
      model.addAttribute("disableObservers", !distinctRoles.contains(EnrollmentHelper.TYPE_OBSERVER));

      // using this just for getting the roles and using them for an official count with the checkboxes at the top of the page
      List<String> listOfRoles = finalEnrollmentList.stream()
              .map(EnrollmentDisplay::getBaseRole)
              .collect(Collectors.toList());

      // count the amount of times each role occurs. This is used for checkboxes at the top of the page
      model.addAttribute("allUserCount", finalEnrollmentList.size());
      model.addAttribute("teacherCount", Collections.frequency(listOfRoles, EnrollmentHelper.TYPE_TEACHER));
      model.addAttribute("studentCount", Collections.frequency(listOfRoles, EnrollmentHelper.TYPE_STUDENT));
      model.addAttribute("taCount", Collections.frequency(listOfRoles, EnrollmentHelper.TYPE_TA));
      model.addAttribute("designerCount", Collections.frequency(listOfRoles, EnrollmentHelper.TYPE_DESIGNER));
      model.addAttribute("observerCount", Collections.frequency(listOfRoles, EnrollmentHelper.TYPE_OBSERVER));

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
   public ModelAndView remove(@RequestParam("user") List<String> userValues, @PathVariable("courseId") String courseId, Model model) {
      log.debug("in /remove");
      OidcAuthenticationToken token = getValidatedToken(courseId);

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

      return index(courseId, model);
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
