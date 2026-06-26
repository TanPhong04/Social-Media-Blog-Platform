package com.socialblog.user.security;

import com.socialblog.user.domain.UserAccount;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.jose.jws.SignatureAlgorithm;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.stereotype.Service;
import java.time.*;
import java.util.*;

@Service
public class JwtService {
    private final JwtEncoder encoder; private final long minutes; private final String issuer; private final String keyId;
    public JwtService(JwtEncoder encoder,@Value("${app.security.access-token-minutes}") long minutes,@Value("${app.security.jwt.issuer}") String issuer,@Value("${app.security.jwt.key-id}") String keyId){this.encoder=encoder;this.minutes=minutes;this.issuer=issuer;this.keyId=keyId;}
    public String create(UserAccount user){
        Instant now=Instant.now();
        JwtClaimsSet claims=JwtClaimsSet.builder().issuer(issuer).issuedAt(now).expiresAt(now.plus(Duration.ofMinutes(minutes)))
                .subject(user.getId().toString()).claim("email",user.getEmail()).claim("roles",List.of(user.getRole().name())).build();
        return encoder.encode(JwtEncoderParameters.from(JwsHeader.with(SignatureAlgorithm.RS256).keyId(keyId).build(),claims)).getTokenValue();
    }
    public long expiresInSeconds(){return Duration.ofMinutes(minutes).toSeconds();}
}
