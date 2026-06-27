package com.socialblog.user.security;

import com.nimbusds.jose.jwk.JWKSet;
import com.nimbusds.jose.jwk.RSAKey;
import com.nimbusds.jose.jwk.source.ImmutableJWKSet;
import com.nimbusds.jose.proc.SecurityContext;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.*;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.util.StringUtils;

import java.security.KeyPair;
import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;
import java.util.ArrayList;

@Configuration
public class SecurityConfig {
    @Bean
    KeyPair jwtKeyPair(@Value("${app.security.jwt.private-key:}") String privateKeyPem,
                       @Value("${app.security.jwt.public-key:}") String publicKeyPem) {
        if (!StringUtils.hasText(privateKeyPem) && !StringUtils.hasText(publicKeyPem)) {
            return RsaKeySupport.localDevelopmentKeyPair();
        }
        if (!StringUtils.hasText(privateKeyPem) || !StringUtils.hasText(publicKeyPem)) {
            throw new IllegalStateException("JWT_PRIVATE_KEY and JWT_PUBLIC_KEY must be configured together");
        }
        RSAPrivateKey privateKey = RsaKeySupport.privateKey(privateKeyPem);
        RSAPublicKey publicKey = RsaKeySupport.publicKey(publicKeyPem);
        return new KeyPair(publicKey, privateKey);
    }

    @Bean
    RSAKey jwtJwk(KeyPair keyPair, @Value("${app.security.jwt.key-id}") String keyId) {
        return new RSAKey.Builder((RSAPublicKey) keyPair.getPublic()).privateKey((RSAPrivateKey) keyPair.getPrivate()).keyID(keyId).build();
    }

    @Bean
    JwtKeyRotationSupport.VerificationKeys jwtVerificationKeys(
            @Value("${app.security.jwt.verification-keys:}") String configuredKeys) {
        return JwtKeyRotationSupport.verificationKeys(configuredKeys);
    }

    @Bean
    JWKSet publicJwkSet(RSAKey jwtJwk, JwtKeyRotationSupport.VerificationKeys verificationKeys) {
        var keys = new ArrayList<com.nimbusds.jose.jwk.JWK>();
        keys.add(jwtJwk.toPublicJWK());
        verificationKeys.keys().stream()
                .filter(key -> !jwtJwk.getKeyID().equals(key.getKeyID()))
                .map(RSAKey::toPublicJWK)
                .forEach(keys::add);
        return new JWKSet(keys);
    }

    @Bean
    JwtEncoder jwtEncoder(RSAKey jwtJwk) {
        return new NimbusJwtEncoder(new ImmutableJWKSet<SecurityContext>(new JWKSet(jwtJwk)));
    }

    @Bean
    JwtDecoder jwtDecoder(JWKSet publicJwkSet, @Value("${app.security.jwt.issuer}") String issuer) {
        return JwtKeyRotationSupport.decoder(publicJwkSet, issuer);
    }

    @Bean PasswordEncoder passwordEncoder(){return new BCryptPasswordEncoder();}
    @Bean SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        return http.csrf(csrf->csrf.disable()).sessionManagement(s->s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(a->a.requestMatchers("/api/v1/auth/**","/.well-known/jwks.json","/actuator/health/**").permitAll().anyRequest().authenticated())
                .oauth2ResourceServer(o->o.jwt(j->{})).build();
    }
}
