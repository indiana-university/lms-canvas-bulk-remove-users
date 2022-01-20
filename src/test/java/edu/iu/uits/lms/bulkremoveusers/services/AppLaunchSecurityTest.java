package edu.iu.uits.lms.bulkremoveusers.services;

import edu.iu.uits.lms.canvas.config.CanvasClientTestConfig;
import edu.iu.uits.lms.canvas.services.AccountService;
import edu.iu.uits.lms.canvas.services.CourseService;
import edu.iu.uits.lms.canvas.services.SectionService;
import edu.iu.uits.lms.iuonly.services.SudsServiceImpl;
import edu.iu.uits.lms.lti.LTIConstants;
import edu.iu.uits.lms.lti.config.LtiClientTestConfig;
import edu.iu.uits.lms.lti.security.LtiAuthenticationProvider;
import edu.iu.uits.lms.lti.security.LtiAuthenticationToken;
import edu.iu.uits.lms.bulkremoveusers.config.ToolConfig;
import edu.iu.uits.lms.bulkremoveusers.controller.BulkRemoveUsersController;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.MessageSource;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.context.WebApplicationContext;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(BulkRemoveUsersController.class)
@Import({ToolConfig.class, CanvasClientTestConfig.class, LtiClientTestConfig.class})
public class AppLaunchSecurityTest {

   @Autowired
   private MockMvc mvc;

   @Autowired
   private WebApplicationContext context;

   @MockBean
   private MessageSource messageSource = null;

   @Autowired
   private AccountService accountService = null;

   @Autowired
   private CourseService courseService = null;

   @Autowired
   private SectionService sectionService = null;

   @Autowired
   private SudsServiceImpl sudsService = null;

//   @Test
//   public void appNoAuthnLaunch() throws Exception {
//      //This is a secured endpoint and should not not allow access without authn
//      mvc.perform(get("/app/index/1234")
//            .header(HttpHeaders.USER_AGENT, TestUtils.defaultUseragent())
//            .contentType(MediaType.APPLICATION_JSON))
//            .andExpect(status().isForbidden());
//   }

//   @Test
//   public void appAuthnWrongContextLaunch() throws Exception {
//      LtiAuthenticationToken token = new LtiAuthenticationToken("userId",
//            "asdf", "systemId",
//            AuthorityUtils.createAuthorityList(LtiAuthenticationProvider.LTI_USER_ROLE, LTIConstants.INSTRUCTOR_AUTHORITY),
//            "unit_test");
//
//      SecurityContextHolder.getContext().setAuthentication(token);
//
//      //This is a secured endpoint and should not not allow access without authn
//      mvc.perform(get("/app/index/1234")
//            .header(HttpHeaders.USER_AGENT, TestUtils.defaultUseragent())
//            .contentType(MediaType.APPLICATION_JSON))
//            .andExpect(status().isOk());
//   }

//   @Test
//   public void appAuthnLaunch() throws Exception {
//      LtiAuthenticationToken token = new LtiAuthenticationToken("userId",
//            "1234", "systemId",
//            AuthorityUtils.createAuthorityList(LtiAuthenticationProvider.LTI_USER_ROLE, LTIConstants.INSTRUCTOR_AUTHORITY),
//            "unit_test");
//
//      SecurityContextHolder.getContext().setAuthentication(token);
//
//      //This is a secured endpoint and should not not allow access without authn
//      mvc.perform(get("/app/index/1234")
//            .header(HttpHeaders.USER_AGENT, TestUtils.defaultUseragent())
//            .contentType(MediaType.APPLICATION_JSON))
//            .andExpect(status().isOk());
//   }

//   @Test
//   public void randomUrlNoAuth() throws Exception {
//      //This is a secured endpoint and should not not allow access without authn
//      mvc.perform(get("/asdf/foobar")
//            .header(HttpHeaders.USER_AGENT, TestUtils.defaultUseragent())
//            .contentType(MediaType.APPLICATION_JSON))
//            .andExpect(status().isForbidden());
//   }
//
//   @Test
//   public void randomUrlWithAuth() throws Exception {
//      LtiAuthenticationToken token = new LtiAuthenticationToken("userId",
//            "1234", "systemId",
//            AuthorityUtils.createAuthorityList(LtiAuthenticationProvider.LTI_USER_ROLE),
//            "unit_test");
//      SecurityContextHolder.getContext().setAuthentication(token);
//
//      //This is a secured endpoint and should not not allow access without authn
//      mvc.perform(get("/asdf/foobar")
//            .header(HttpHeaders.USER_AGENT, TestUtils.defaultUseragent())
//            .contentType(MediaType.APPLICATION_JSON))
//            .andExpect(status().isNotFound());
//   }
}
