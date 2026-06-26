package com.socialblog.comment.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.*;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.util.StringUtils;

import java.security.interfaces.RSAPublicKey;

@Configuration
public class SecurityConfig {
    @Bean RSAPublicKey jwtPublicKey(@Value("${app.security.jwt.public-key:}") String value) {return RsaPublicKeySupport.publicKey(value);}
    @Bean JwtDecoder decoder(RSAPublicKey key,@Value("${app.security.jwt.jwk-set-uri:}") String jwkSetUri,@Value("${app.security.jwt.issuer}") String issuer){NimbusJwtDecoder decoder=StringUtils.hasText(jwkSetUri)?NimbusJwtDecoder.withJwkSetUri(jwkSetUri).build():NimbusJwtDecoder.withPublicKey(key).build();decoder.setJwtValidator(JwtValidators.createDefaultWithIssuer(issuer));return decoder;}
    @Bean SecurityFilterChain chain(HttpSecurity h)throws Exception{return h.csrf(c->c.disable()).sessionManagement(s->s.sessionCreationPolicy(SessionCreationPolicy.STATELESS)).authorizeHttpRequests(a->a.requestMatchers("/actuator/health/**").permitAll().requestMatchers(HttpMethod.GET,"/api/v1/comments/articles/**").permitAll().anyRequest().authenticated()).oauth2ResourceServer(o->o.jwt(j->{})).build();}
}
