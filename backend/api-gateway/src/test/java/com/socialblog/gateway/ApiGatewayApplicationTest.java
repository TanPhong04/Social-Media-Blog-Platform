package com.socialblog.gateway;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.cloud.gateway.filter.FilterDefinition;
import org.springframework.cloud.gateway.route.RouteDefinitionLocator;

import java.util.Set;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
class ApiGatewayApplicationTest {
    private final RouteDefinitionLocator routeDefinitions;

    @Autowired
    ApiGatewayApplicationTest(RouteDefinitionLocator routeDefinitions) {
        this.routeDefinitions = routeDefinitions;
    }

    @Test
    void contextLoads() {
    }

    @Test
    void sensitiveWriteRoutesHaveRateLimitFilters() {
        Set<String> rateLimitedRouteIds = routeDefinitions.getRouteDefinitions()
                .filter(route -> route.getFilters().stream().map(FilterDefinition::getName).anyMatch("RequestRateLimiter"::equals))
                .map(route -> route.getId())
                .collectList()
                .block()
                .stream()
                .collect(Collectors.toSet());

        assertThat(rateLimitedRouteIds).containsExactlyInAnyOrder(
                "auth-write-rate-limited",
                "article-write-rate-limited",
                "comment-write-rate-limited",
                "interaction-write-rate-limited",
                "follower-write-rate-limited",
                "notification-write-rate-limited"
        );
    }
}
