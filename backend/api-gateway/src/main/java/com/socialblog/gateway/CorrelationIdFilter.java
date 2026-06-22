package com.socialblog.gateway;
import org.springframework.cloud.gateway.filter.*;
import org.springframework.core.Ordered;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;
import java.util.UUID;
@Component
public class CorrelationIdFilter implements GlobalFilter, Ordered {
    public static final String HEADER="X-Correlation-ID";
    @Override public Mono<Void> filter(org.springframework.web.server.ServerWebExchange exchange,GatewayFilterChain chain){
        String id=exchange.getRequest().getHeaders().getFirst(HEADER); if(id==null||id.isBlank()) id=UUID.randomUUID().toString();
        var request=exchange.getRequest().mutate().header(HEADER,id).build(); exchange.getResponse().getHeaders().set(HEADER,id);
        return chain.filter(exchange.mutate().request(request).build());
    }
    @Override public int getOrder(){return -100;}
}

