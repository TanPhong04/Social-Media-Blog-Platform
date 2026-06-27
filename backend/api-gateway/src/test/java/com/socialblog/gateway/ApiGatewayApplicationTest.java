package com.socialblog.gateway;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.cloud.gateway.filter.FilterDefinition;
import org.springframework.cloud.gateway.handler.predicate.PredicateDefinition;
import org.springframework.cloud.gateway.route.RouteDefinition;
import org.springframework.cloud.gateway.route.RouteDefinitionLocator;
import org.yaml.snakeyaml.Yaml;

import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;
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

    @Test
    void gatewayRoutesMatchDocumentedServicePrefixes() {
        Map<String, Set<String>> documentedPrefixes = Map.of(
                "user-service", Set.of("/api/v1/auth/**", "/api/v1/users/**"),
                "article-service", Set.of("/api/v1/articles/**"),
                "comment-service", Set.of("/api/v1/comments/**"),
                "interaction-service", Set.of("/api/v1/interactions/**"),
                "follower-service", Set.of("/api/v1/follows/**"),
                "notification-service", Set.of("/api/v1/notifications/**")
        );

        Map<String, RouteDefinition> routesById = routeDefinitions.getRouteDefinitions()
                .filter(route -> documentedPrefixes.containsKey(route.getId()))
                .collectMap(RouteDefinition::getId)
                .block();

        assertThat(routesById).containsOnlyKeys(documentedPrefixes.keySet());
        documentedPrefixes.forEach((routeId, pathPatterns) -> {
            RouteDefinition route = routesById.get(routeId);
            assertThat(route.getOrder()).isEqualTo(100);
            assertThat(pathPredicates(route)).isEqualTo(pathPatterns);
        });
    }

    @Test
    @SuppressWarnings("unchecked")
    void openApiSpecCoversGatewayRoutePrefixes() throws Exception {
        Path specPath = Path.of("..", "..", "docs", "openapi", "social-blog-api.yaml");
        Map<String, Object> spec;
        try (InputStream input = Files.newInputStream(specPath)) {
            spec = new Yaml().load(input);
        }

        Map<String, Object> paths = (Map<String, Object>) spec.get("paths");
        assertThat(paths.keySet()).anyMatch(path -> path.startsWith("/api/v1/auth/"));
        assertThat(paths.keySet()).contains(
                "/api/v1/users/me",
                "/api/v1/articles",
                "/api/v1/comments",
                "/api/v1/interactions/{type}/{target}",
                "/api/v1/follows/{target}",
                "/api/v1/notifications"
        );
        assertJsonResponseSchema(paths, "/api/v1/users/me", "get", "200");
        assertJsonResponseSchema(paths, "/api/v1/articles", "get", "200");
        assertJsonResponseSchema(paths, "/api/v1/comments", "post", "201");
        assertJsonResponseSchema(paths, "/api/v1/interactions/{type}/{target}", "get", "200");
        assertJsonResponseSchema(paths, "/api/v1/follows/status/{target}", "get", "200");
        assertJsonResponseSchema(paths, "/api/v1/notifications", "get", "200");
    }

    private Set<String> pathPredicates(RouteDefinition route) {
        return route.getPredicates().stream()
                .filter(predicate -> "Path".equals(predicate.getName()))
                .findFirst()
                .map(PredicateDefinition::getArgs)
                .map(args -> Set.copyOf(args.values()))
                .orElseThrow();
    }

    @SuppressWarnings("unchecked")
    private void assertJsonResponseSchema(Map<String, Object> paths, String path, String method, String status) {
        Map<String, Object> pathItem = (Map<String, Object>) paths.get(path);
        Map<String, Object> operation = (Map<String, Object>) pathItem.get(method);
        Map<String, Object> responses = (Map<String, Object>) operation.get("responses");
        Map<String, Object> response = (Map<String, Object>) responses.get(status);
        Map<String, Object> content = (Map<String, Object>) response.get("content");
        Map<String, Object> json = (Map<String, Object>) content.get("application/json");

        assertThat(json).containsKey("schema");
    }
}
