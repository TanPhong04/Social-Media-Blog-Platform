package com.socialblog.article.api;
import com.socialblog.article.api.ArticleDtos.*;import com.socialblog.article.application.ArticleService;import jakarta.validation.Valid;import org.springframework.data.domain.*;import org.springframework.http.*;import org.springframework.security.core.annotation.AuthenticationPrincipal;import org.springframework.security.oauth2.jwt.Jwt;import org.springframework.web.bind.annotation.*;import java.util.UUID;
@RestController @RequestMapping("/api/v1/articles") public class ArticleController{
 private final ArticleService service;public ArticleController(ArticleService service){this.service=service;}
 @GetMapping ResponseEntity<Page<Response>>feed(@RequestParam(defaultValue="0")int page,@RequestParam(defaultValue="20")int size){return ResponseEntity.ok(service.feed(PageRequest.of(page,Math.min(size,50))));}
 @GetMapping("/by-slug/{slug}")Response bySlug(@PathVariable String slug){return service.publicBySlug(slug);}
 @GetMapping("/mine")Page<Response>mine(@AuthenticationPrincipal Jwt jwt,@RequestParam(defaultValue="0")int page,@RequestParam(defaultValue="20")int size){return service.mine(user(jwt),PageRequest.of(page,Math.min(size,50)));}
 @PostMapping ResponseEntity<Response>create(@AuthenticationPrincipal Jwt jwt,@Valid @RequestBody WriteRequest r){return ResponseEntity.status(201).body(service.create(user(jwt),r));}
 @PutMapping("/{id}")Response update(@PathVariable UUID id,@AuthenticationPrincipal Jwt jwt,@Valid @RequestBody WriteRequest r){return service.update(id,user(jwt),r);}
 @PostMapping("/{id}/publish")Response publish(@PathVariable UUID id,@AuthenticationPrincipal Jwt jwt){return service.publish(id,user(jwt));}
 @PostMapping("/{id}/unpublish")Response unpublish(@PathVariable UUID id,@AuthenticationPrincipal Jwt jwt){return service.unpublish(id,user(jwt));}
 @DeleteMapping("/{id}")@ResponseStatus(HttpStatus.NO_CONTENT)void delete(@PathVariable UUID id,@AuthenticationPrincipal Jwt jwt){service.delete(id,user(jwt));}
 private UUID user(Jwt jwt){return UUID.fromString(jwt.getSubject());}
}
