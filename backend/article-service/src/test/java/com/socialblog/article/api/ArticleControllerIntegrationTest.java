package com.socialblog.article.api;
import com.fasterxml.jackson.databind.*;import com.socialblog.article.domain.*;import com.socialblog.article.repository.*;import org.junit.jupiter.api.Test;import org.springframework.beans.factory.annotation.Autowired;import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;import org.springframework.boot.test.context.SpringBootTest;import org.springframework.http.MediaType;import org.springframework.test.web.servlet.MockMvc;import java.util.UUID;import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
@SpringBootTest @AutoConfigureMockMvc class ArticleControllerIntegrationTest{
 @Autowired MockMvc mvc;@Autowired ObjectMapper json;@Autowired OutboxEventRepository outbox;@Autowired FollowProjectionRepository follows;private final UUID author=UUID.randomUUID();
 @Test void draftPublishReadAndProtectOwnership()throws Exception{
  String request="{\"title\":\"First Article\",\"summary\":\"Summary\",\"content\":\"Long content\",\"tags\":[\"Java\",\"Microservices\"]}";
  String created=mvc.perform(post("/api/v1/articles").with(jwt().jwt(j->j.subject(author.toString()))).contentType(MediaType.APPLICATION_JSON).content(request)).andExpect(status().isCreated()).andExpect(jsonPath("$.status").value("DRAFT")).andReturn().getResponse().getContentAsString();
  JsonNode article=json.readTree(created);String id=article.get("id").asText();String slug=article.get("slug").asText();
  mvc.perform(get("/api/v1/articles/by-slug/"+slug)).andExpect(status().isNotFound());
  mvc.perform(post("/api/v1/articles/"+id+"/publish").with(jwt().jwt(j->j.subject(UUID.randomUUID().toString())))).andExpect(status().isForbidden());
  mvc.perform(post("/api/v1/articles/"+id+"/publish").header("X-Correlation-ID","article-publish-correlation").with(jwt().jwt(j->j.subject(author.toString())))).andExpect(status().isOk()).andExpect(jsonPath("$.status").value("PUBLISHED"));
  assertThat(outbox.findAll()).anySatisfy(e->assertThat(e.getPayload()).contains("ArticlePublished","article-publish-correlation"));
  mvc.perform(get("/api/v1/articles/by-slug/"+slug)).andExpect(status().isOk()).andExpect(jsonPath("$.title").value("First Article"));
  mvc.perform(get("/api/v1/articles")).andExpect(status().isOk()).andExpect(jsonPath("$.content[0].id").value(id));
  UUID reader=UUID.randomUUID();follows.save(new FollowProjection(new FollowKey(reader,author)));
  mvc.perform(get("/api/v1/articles/following").with(jwt().jwt(j->j.subject(reader.toString())))).andExpect(status().isOk()).andExpect(jsonPath("$.content[0].id").value(id));
  mvc.perform(delete("/api/v1/articles/"+id).header("X-Correlation-ID","article-delete-correlation").with(jwt().jwt(j->j.subject(author.toString())))).andExpect(status().isNoContent());
  assertThat(outbox.findAll()).anySatisfy(e->assertThat(e.getPayload()).contains("ArticleDeleted","article-delete-correlation"));
  mvc.perform(get("/api/v1/articles/by-slug/"+slug)).andExpect(status().isNotFound());
 }
 @Test void mutationsRequireAuthentication()throws Exception{mvc.perform(post("/api/v1/articles").contentType(MediaType.APPLICATION_JSON).content("{}" )).andExpect(status().isUnauthorized());}
 @Test void validatesPaginationAndContentLimit()throws Exception{
  mvc.perform(get("/api/v1/articles?page=-1")).andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("INVALID_PAGE"));
  String oversized="x".repeat(50001);
  String request=json.writeValueAsString(java.util.Map.of("title","Too Long","content",oversized));
  mvc.perform(post("/api/v1/articles").with(jwt().jwt(j->j.subject(author.toString()))).contentType(MediaType.APPLICATION_JSON).content(request))
          .andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("VALIDATION_FAILED")).andExpect(jsonPath("$.fields.content").isNotEmpty());
  mvc.perform(post("/api/v1/articles/not-a-uuid/publish").with(jwt().jwt(j->j.subject(author.toString()))))
          .andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("INVALID_REQUEST_PARAMETER")).andExpect(jsonPath("$.fields.id").isNotEmpty());
 }
}
