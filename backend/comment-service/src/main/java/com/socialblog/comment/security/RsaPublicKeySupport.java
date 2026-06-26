package com.socialblog.comment.security;

import java.nio.charset.StandardCharsets;
import java.security.KeyFactory;
import java.security.KeyPairGenerator;
import java.security.SecureRandom;
import java.security.interfaces.RSAPublicKey;
import java.security.spec.X509EncodedKeySpec;
import java.util.Base64;

final class RsaPublicKeySupport {
    private static final byte[] LOCAL_DEVELOPMENT_SEED = "social-blog-platform-local-development-rsa-key-v1".getBytes(StandardCharsets.UTF_8);
    private RsaPublicKeySupport() {}
    static RSAPublicKey publicKey(String pem) {
        if (pem == null || pem.isBlank()) return localDevelopmentPublicKey();
        try {return (RSAPublicKey) KeyFactory.getInstance("RSA").generatePublic(new X509EncodedKeySpec(decodePem(pem)));}
        catch (Exception ex) {throw new IllegalStateException("JWT public key must be an RSA X.509 PEM public key", ex);}
    }
    private static RSAPublicKey localDevelopmentPublicKey() {
        try {SecureRandom random=SecureRandom.getInstance("SHA1PRNG");random.setSeed(LOCAL_DEVELOPMENT_SEED);KeyPairGenerator generator=KeyPairGenerator.getInstance("RSA");generator.initialize(2048,random);return (RSAPublicKey) generator.generateKeyPair().getPublic();}
        catch (Exception ex) {throw new IllegalStateException("Unable to create local development RSA public key", ex);}
    }
    private static byte[] decodePem(String pem) {String normalized=pem.replace("\\n","\n").replace("-----BEGIN PUBLIC KEY-----","").replace("-----END PUBLIC KEY-----","").replaceAll("\\s","");return Base64.getDecoder().decode(normalized);}
}
