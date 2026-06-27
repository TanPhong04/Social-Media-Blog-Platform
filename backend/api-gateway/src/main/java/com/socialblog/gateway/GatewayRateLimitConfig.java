package com.socialblog.gateway;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.ratelimit.KeyResolver;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.server.reactive.ServerHttpRequest;
import reactor.core.publisher.Mono;

import java.net.InetSocketAddress;

@Configuration
public class GatewayRateLimitConfig {
    @Bean
    KeyResolver clientIpKeyResolver(
            @Value("${socialblog.gateway.rate-limit.trust-forwarded-for:false}") boolean trustForwardedFor) {
        return exchange -> Mono.just(resolveClientKey(exchange.getRequest(), trustForwardedFor));
    }

    static String resolveClientKey(ServerHttpRequest request, boolean trustForwardedFor) {
        if (trustForwardedFor) {
            String forwardedFor = request.getHeaders().getFirst("X-Forwarded-For");
            if (forwardedFor != null && !forwardedFor.isBlank()) {
                return forwardedFor.split(",", 2)[0].trim();
            }
        }
        InetSocketAddress remoteAddress = request.getRemoteAddress();
        if (remoteAddress == null || remoteAddress.getAddress() == null) {
            return "unknown-client";
        }
        return remoteAddress.getAddress().getHostAddress();
    }
}
