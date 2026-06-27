package com.socialblog.user.security;

import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.jwk.JWKSet;
import com.nimbusds.jose.jwk.RSAKey;
import com.nimbusds.jose.jwk.source.ImmutableJWKSet;
import com.nimbusds.jose.proc.JWSVerificationKeySelector;
import com.nimbusds.jose.proc.SecurityContext;
import com.nimbusds.jwt.proc.DefaultJWTProcessor;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtValidators;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;

import java.security.interfaces.RSAPublicKey;
import java.util.ArrayList;
import java.util.List;

final class JwtKeyRotationSupport {
    private static final String ENTRY_SEPARATOR = "\\|\\|";
    private static final String KID_SEPARATOR = "::";

    private JwtKeyRotationSupport() {
    }

    static VerificationKeys verificationKeys(String value) {
        if (value == null || value.isBlank()) {
            return new VerificationKeys(List.of());
        }
        List<RSAKey> keys = new ArrayList<>();
        for (String entry : value.split(ENTRY_SEPARATOR)) {
            if (entry.isBlank()) {
                continue;
            }
            int separator = entry.indexOf(KID_SEPARATOR);
            if (separator <= 0 || separator == entry.length() - KID_SEPARATOR.length()) {
                throw new IllegalStateException("JWT_VERIFICATION_KEYS entries must use kid::public-key-pem");
            }
            String keyId = entry.substring(0, separator).trim();
            String publicKeyPem = entry.substring(separator + KID_SEPARATOR.length()).trim();
            RSAPublicKey publicKey = RsaKeySupport.publicKey(publicKeyPem);
            keys.add(new RSAKey.Builder(publicKey).keyID(keyId).build());
        }
        return new VerificationKeys(List.copyOf(keys));
    }

    static JwtDecoder decoder(JWKSet publicJwkSet, String issuer) {
        var source = new ImmutableJWKSet<SecurityContext>(publicJwkSet);
        var processor = new DefaultJWTProcessor<SecurityContext>();
        processor.setJWSKeySelector(new JWSVerificationKeySelector<>(JWSAlgorithm.RS256, source));
        processor.setJWTClaimsSetVerifier((claims, context) -> {
        });
        NimbusJwtDecoder decoder = new NimbusJwtDecoder(processor);
        decoder.setJwtValidator(JwtValidators.createDefaultWithIssuer(issuer));
        return decoder;
    }

    record VerificationKeys(List<RSAKey> keys) {
    }
}
