package com.socialblog.user.api;

import com.fasterxml.jackson.databind.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.web.servlet.MockMvc;
import com.socialblog.user.domain.OutboxEvent;
import com.socialblog.user.repository.OutboxEventRepository;
import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest @AutoConfigureMockMvc
class AuthControllerIntegrationTest {
    @Autowired MockMvc mvc; @Autowired ObjectMapper json; @Autowired OutboxEventRepository outbox; @Autowired JwtDecoder jwtDecoder;
    @Test void registerLoginRefreshAndReadProfile() throws Exception {
        String register="{\"email\":\"Alice@Example.com\",\"password\":\"password123\",\"displayName\":\"Alice\"}";
        String body=mvc.perform(post("/api/v1/auth/register").header("X-Correlation-ID","test-correlation-123").contentType(MediaType.APPLICATION_JSON).content(register))
                .andExpect(status().isCreated()).andExpect(header().string("X-Correlation-ID","test-correlation-123"))
                .andExpect(jsonPath("$.accessToken").isString()).andReturn().getResponse().getContentAsString();
        JsonNode tokens=json.readTree(body); String access=tokens.get("accessToken").asText(); String refresh=tokens.get("refreshToken").asText();
        Jwt jwt=jwtDecoder.decode(access);
        assertThat(jwt.getHeaders().get("alg").toString()).isEqualTo("RS256");
        assertThat(jwt.getHeaders().get("kid").toString()).isEqualTo("local-test-rsa");
        assertThat(jwt.getIssuer().toString()).isEqualTo("https://social-blog-platform.test");
        mvc.perform(get("/.well-known/jwks.json")).andExpect(status().isOk())
                .andExpect(jsonPath("$.keys[0].kty").value("RSA"))
                .andExpect(jsonPath("$.keys[0].kid").value("local-test-rsa"))
                .andExpect(jsonPath("$.keys[0].d").doesNotExist());
        assertThat(outbox.countByStatus(OutboxEvent.Status.PENDING)).isPositive();
        assertThat(outbox.findAll()).anySatisfy(event->assertThat(event.getPayload()).contains("\"correlationId\":\"test-correlation-123\""));
        mvc.perform(get("/api/v1/users/me").header("Authorization","Bearer "+access)).andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("alice@example.com")).andExpect(jsonPath("$.displayName").value("Alice"));
        mvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON).content("{\"email\":\"alice@example.com\",\"password\":\"wrong-password\"}"))
                .andExpect(status().isUnauthorized()).andExpect(jsonPath("$.code").value("INVALID_CREDENTIALS"));
        String refreshed=mvc.perform(post("/api/v1/auth/refresh").contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(java.util.Map.of("refreshToken",refresh))))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        String rotated=json.readTree(refreshed).get("refreshToken").asText(); assertThat(rotated).isNotEqualTo(refresh);
        mvc.perform(post("/api/v1/auth/refresh").contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(java.util.Map.of("refreshToken",refresh))))
                .andExpect(status().isUnauthorized());
        mvc.perform(post("/api/v1/auth/logout").contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(java.util.Map.of("refreshToken",rotated))))
                .andExpect(status().isNoContent());
        mvc.perform(post("/api/v1/auth/refresh").contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(java.util.Map.of("refreshToken",rotated))))
                .andExpect(status().isUnauthorized());
    }
    @Test void rejectsDuplicateEmail() throws Exception {
        String request="{\"email\":\"duplicate@example.com\",\"password\":\"password123\",\"displayName\":\"One\"}";
        mvc.perform(post("/api/v1/auth/register").contentType(MediaType.APPLICATION_JSON).content(request)).andExpect(status().isCreated());
        mvc.perform(post("/api/v1/auth/register").contentType(MediaType.APPLICATION_JSON).content(request)).andExpect(status().isConflict()).andExpect(jsonPath("$.code").value("EMAIL_ALREADY_EXISTS"));
    }
    @Test void validatesRegistration() throws Exception {
        mvc.perform(post("/api/v1/auth/register").contentType(MediaType.APPLICATION_JSON).content("{\"email\":\"bad\",\"password\":\"short\",\"displayName\":\"\"}"))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));
    }
}
