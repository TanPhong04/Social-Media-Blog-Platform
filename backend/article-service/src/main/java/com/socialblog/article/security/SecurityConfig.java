package com.socialblog.article.security;
import org.springframework.beans.factory.annotation.Value;import org.springframework.context.annotation.*;import org.springframework.http.HttpMethod;import org.springframework.security.config.annotation.web.builders.HttpSecurity;import org.springframework.security.config.http.SessionCreationPolicy;import org.springframework.security.oauth2.jwt.*;import org.springframework.security.web.SecurityFilterChain;import javax.crypto.SecretKey;import javax.crypto.spec.SecretKeySpec;import java.nio.charset.StandardCharsets;
@Configuration public class SecurityConfig {
 @Bean SecretKey key(@Value("${app.security.jwt-secret}")String value){return new SecretKeySpec(value.getBytes(StandardCharsets.UTF_8),"HmacSHA256");}
 @Bean JwtDecoder decoder(SecretKey key){return NimbusJwtDecoder.withSecretKey(key).build();}
 @Bean SecurityFilterChain chain(HttpSecurity http)throws Exception{return http.csrf(c->c.disable()).sessionManagement(s->s.sessionCreationPolicy(SessionCreationPolicy.STATELESS)).authorizeHttpRequests(a->a.requestMatchers(HttpMethod.GET,"/api/v1/articles","/api/v1/articles/by-slug/**").permitAll().anyRequest().authenticated()).oauth2ResourceServer(o->o.jwt(j->{})).build();}
}
