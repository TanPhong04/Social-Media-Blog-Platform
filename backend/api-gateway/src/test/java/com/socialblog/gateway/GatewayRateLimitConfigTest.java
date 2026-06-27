package com.socialblog.gateway;

import org.junit.jupiter.api.Test;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;

import java.net.InetSocketAddress;

import static org.assertj.core.api.Assertions.assertThat;

class GatewayRateLimitConfigTest {
    @Test
    void usesRemoteAddressByDefault() {
        var request = MockServerHttpRequest.get("/api/v1/auth/login")
                .remoteAddress(new InetSocketAddress("192.0.2.10", 54421))
                .build();

        assertThat(GatewayRateLimitConfig.resolveClientKey(request, false)).isEqualTo("192.0.2.10");
    }

    @Test
    void usesFirstForwardedAddressOnlyWhenTrusted() {
        var request = MockServerHttpRequest.get("/api/v1/auth/login")
                .header("X-Forwarded-For", "198.51.100.7, 203.0.113.9")
                .remoteAddress(new InetSocketAddress("192.0.2.10", 54421))
                .build();

        assertThat(GatewayRateLimitConfig.resolveClientKey(request, true)).isEqualTo("198.51.100.7");
        assertThat(GatewayRateLimitConfig.resolveClientKey(request, false)).isEqualTo("192.0.2.10");
    }

    @Test
    void fallsBackWhenRemoteAddressIsMissing() {
        var request = MockServerHttpRequest.get("/api/v1/auth/login").build();

        assertThat(GatewayRateLimitConfig.resolveClientKey(request, false)).isEqualTo("unknown-client");
    }
}
