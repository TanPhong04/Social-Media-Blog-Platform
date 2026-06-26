package com.socialblog.user.security;

import java.nio.charset.StandardCharsets;
import java.security.KeyFactory;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.SecureRandom;
import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.X509EncodedKeySpec;
import java.util.Base64;

final class RsaKeySupport {
    private static final byte[] LOCAL_DEVELOPMENT_SEED = "social-blog-platform-local-development-rsa-key-v1".getBytes(StandardCharsets.UTF_8);

    private RsaKeySupport() {
    }

    static KeyPair localDevelopmentKeyPair() {
        try {
            SecureRandom random = SecureRandom.getInstance("SHA1PRNG");
            random.setSeed(LOCAL_DEVELOPMENT_SEED);
            KeyPairGenerator generator = KeyPairGenerator.getInstance("RSA");
            generator.initialize(2048, random);
            return generator.generateKeyPair();
        } catch (Exception ex) {
            throw new IllegalStateException("Unable to create local development RSA key pair", ex);
        }
    }

    static RSAPublicKey publicKey(String pem) {
        try {
            byte[] encoded = decodePem(pem, "PUBLIC KEY");
            return (RSAPublicKey) KeyFactory.getInstance("RSA").generatePublic(new X509EncodedKeySpec(encoded));
        } catch (Exception ex) {
            throw new IllegalStateException("JWT public key must be an RSA X.509 PEM public key", ex);
        }
    }

    static RSAPrivateKey privateKey(String pem) {
        try {
            byte[] encoded = decodePem(pem, "PRIVATE KEY");
            return (RSAPrivateKey) KeyFactory.getInstance("RSA").generatePrivate(new PKCS8EncodedKeySpec(encoded));
        } catch (Exception ex) {
            throw new IllegalStateException("JWT private key must be an RSA PKCS#8 PEM private key", ex);
        }
    }

    private static byte[] decodePem(String pem, String type) {
        String normalized = pem.replace("\\n", "\n")
                .replace("-----BEGIN " + type + "-----", "")
                .replace("-----END " + type + "-----", "")
                .replaceAll("\\s", "");
        return Base64.getDecoder().decode(normalized);
    }
}
