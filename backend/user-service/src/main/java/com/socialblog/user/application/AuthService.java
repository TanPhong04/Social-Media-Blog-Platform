package com.socialblog.user.application;

import com.socialblog.user.api.ApiException;
import com.socialblog.user.api.AuthDtos.*;
import com.socialblog.user.domain.*;
import com.socialblog.user.repository.*;
import com.socialblog.user.security.JwtService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.nio.charset.StandardCharsets;
import java.security.*;
import java.time.*;
import java.util.*;

@Service
public class AuthService {
    private final UserRepository users; private final RefreshTokenRepository refreshTokens; private final OutboxEventRepository outbox; private final DomainEventFactory events; private final PasswordEncoder passwords; private final JwtService jwt; private final long refreshDays; private final SecureRandom random=new SecureRandom();
    public AuthService(UserRepository users,RefreshTokenRepository refreshTokens,OutboxEventRepository outbox,DomainEventFactory events,PasswordEncoder passwords,JwtService jwt,@Value("${app.security.refresh-token-days}") long refreshDays){this.users=users;this.refreshTokens=refreshTokens;this.outbox=outbox;this.events=events;this.passwords=passwords;this.jwt=jwt;this.refreshDays=refreshDays;}
    @Transactional public TokenResponse register(RegisterRequest req){
        String email=normalize(req.email()); if(users.existsByEmailIgnoreCase(email)) throw new ApiException(HttpStatus.CONFLICT,"EMAIL_ALREADY_EXISTS","Email is already registered");
        UserAccount user=users.save(new UserAccount(email,passwords.encode(req.password()),req.displayName().trim()));
        outbox.save(events.userRegistered(user));
        return issue(user);
    }
    @Transactional public TokenResponse login(LoginRequest req){
        UserAccount user=users.findByEmailIgnoreCase(normalize(req.email())).orElseThrow(this::invalidCredentials);
        if(!passwords.matches(req.password(),user.getPasswordHash())) throw invalidCredentials();
        if(user.getStatus()!=UserAccount.Status.ACTIVE) throw new ApiException(HttpStatus.FORBIDDEN,"ACCOUNT_NOT_ACTIVE","Account is not active");
        return issue(user);
    }
    @Transactional public TokenResponse refresh(RefreshRequest req){
        RefreshToken stored=refreshTokens.findByTokenHash(hash(req.refreshToken())).orElseThrow(this::invalidRefresh);
        if(!stored.isUsable()) throw invalidRefresh(); stored.revoke();
        UserAccount user=users.findById(stored.getUserId()).orElseThrow(this::invalidRefresh); return issue(user);
    }
    @Transactional public void logout(RefreshRequest req){refreshTokens.findByTokenHash(hash(req.refreshToken())).ifPresent(RefreshToken::revoke);}
    private TokenResponse issue(UserAccount user){
        byte[] bytes=new byte[48];random.nextBytes(bytes);String raw=Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        refreshTokens.save(new RefreshToken(user.getId(),hash(raw),Instant.now().plus(Duration.ofDays(refreshDays))));
        return new TokenResponse(jwt.create(user),raw,"Bearer",jwt.expiresInSeconds());
    }
    private String normalize(String email){return email.trim().toLowerCase(Locale.ROOT);}
    private ApiException invalidCredentials(){return new ApiException(HttpStatus.UNAUTHORIZED,"INVALID_CREDENTIALS","Email or password is incorrect");}
    private ApiException invalidRefresh(){return new ApiException(HttpStatus.UNAUTHORIZED,"INVALID_REFRESH_TOKEN","Refresh token is invalid or expired");}
    private String hash(String value){try{return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8)));}catch(NoSuchAlgorithmException e){throw new IllegalStateException(e);}}
}
