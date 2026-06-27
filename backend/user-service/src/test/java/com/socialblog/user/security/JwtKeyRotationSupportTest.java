package com.socialblog.user.security;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class JwtKeyRotationSupportTest {
    private static final String LOCAL_PUBLIC_KEY = """
            -----BEGIN PUBLIC KEY-----
            MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAmxkyx2EMkG9sYUWc8cJE
            apkiHBCR3YxLqOk9BAkNzPlHLbTMG3jwdwDvSuNXTmKCiihyOSR1HMS99MAQwXTE
            WVf1ppQnnTfKpQ86YMOo7E5KoL7oLRPeuYAuLwZmxYqZW/rzDfObPzmS63lrf5q5
            L6/98In/SNnr7s4Dw041xwZm0HSlzcWd6KZlbxrNuUQ1AXGwNPJwwCwkA+xBaj6x
            r7eP/+b7bxx/7pEe8ik83rACBjIdDSbJPgpw03c0ffXAAUcbCsL7tCaXlrZEM77E
            4/buSbZN2F/0TCXxyYyi9FxocoiR/Rp4oRnXLcJXlCEvY/QjGZF57NJtCQBDeNbw
            ZwIDAQAB
            -----END PUBLIC KEY-----
            """;

    @Test
    void parsesConfiguredVerificationKeys() {
        String value = "previous-key::" + LOCAL_PUBLIC_KEY.replace("\n", "\\n");

        var keys = JwtKeyRotationSupport.verificationKeys(value);

        assertThat(keys.keys()).hasSize(1);
        assertThat(keys.keys().getFirst().getKeyID()).isEqualTo("previous-key");
    }

    @Test
    void rejectsMalformedConfiguredVerificationKeys() {
        assertThatThrownBy(() -> JwtKeyRotationSupport.verificationKeys("missing-separator"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("kid::public-key-pem");
    }
}
