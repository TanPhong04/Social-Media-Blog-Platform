package com.socialblog.user.security;

import com.socialblog.user.domain.UserAccount;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.stereotype.Service;
import java.time.*;
import java.util.*;

@Service
public class JwtService {
    private final JwtEncoder encoder; private final long minutes;
    public JwtService(JwtEncoder encoder,@Value("${app.security.access-token-minutes}") long minutes){this.encoder=encoder;this.minutes=minutes;}
    public String create(UserAccount user){
        Instant now=Instant.now();
        JwtClaimsSet claims=JwtClaimsSet.builder().issuer("social-blog-user-service").issuedAt(now).expiresAt(now.plus(Duration.ofMinutes(minutes)))
                .subject(user.getId().toString()).claim("email",user.getEmail()).claim("roles",List.of(user.getRole().name())).build();
        return encoder.encode(JwtEncoderParameters.from(JwsHeader.with(() -> "HS256").build(),claims)).getTokenValue();
    }
    public long expiresInSeconds(){return Duration.ofMinutes(minutes).toSeconds();}
}

