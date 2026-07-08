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
    private final UserRepository users; private final RefreshTokenRepository refreshTokens; private final OutboxEventRepository outbox; private final DomainEventFactory events; private final PasswordEncoder passwords; private final JwtService jwt; private final EmailOtpRepository otps; private final long refreshDays; private final String resendApiKey; private final String googleClientId; private final SecureRandom random=new SecureRandom();
    public AuthService(UserRepository users,RefreshTokenRepository refreshTokens,OutboxEventRepository outbox,DomainEventFactory events,PasswordEncoder passwords,JwtService jwt,EmailOtpRepository otps,@Value("${app.security.refresh-token-days}") long refreshDays,@Value("${app.resend.api-key:}") String resendApiKey,@Value("${app.google.client-id:}") String googleClientId){this.users=users;this.refreshTokens=refreshTokens;this.outbox=outbox;this.events=events;this.passwords=passwords;this.jwt=jwt;this.otps=otps;this.refreshDays=refreshDays;this.resendApiKey=resendApiKey;this.googleClientId=googleClientId;}
    
    @Transactional public void sendOtp(SendOtpRequest req) {
        String email = normalize(req.email());
        if(users.existsByEmailIgnoreCase(email)) throw new ApiException(HttpStatus.CONFLICT,"EMAIL_ALREADY_EXISTS","Email is already registered");
        String otp = String.format("%06d", random.nextInt(1000000));
        otps.save(new EmailOtp(email, otp, Instant.now().plus(Duration.ofMinutes(10))));
        
        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            java.util.Map<String, String> payload = new java.util.HashMap<>();
            payload.put("from", "noreply@axion.id.vn");
            payload.put("to", email);
            payload.put("subject", "Mã xác thực đăng ký tài khoản - Axion Social");
            
            String htmlTemplate = """
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                <div style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 30px 20px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: 1px;">AXION SOCIAL</h1>
                </div>
                <div style="padding: 40px 30px; background-color: #ffffff;">
                    <h2 style="margin-top: 0; color: #1f2937; font-size: 22px; font-weight: 600;">Xác thực tài khoản của bạn</h2>
                    <p style="font-size: 16px; line-height: 1.6; color: #4b5563; margin-bottom: 25px;">
                        Chào bạn,<br><br>
                        Cảm ơn bạn đã tham gia cộng đồng Axion Social. Để hoàn tất việc đăng ký, vui lòng sử dụng mã xác thực gồm 6 chữ số dưới đây:
                    </p>
                    <div style="text-align: center; margin: 35px 0;">
                        <span style="display: inline-block; font-size: 36px; font-weight: 800; letter-spacing: 12px; color: #4f46e5; background-color: #e0e7ff; padding: 20px 35px; border-radius: 12px; border: 2px dashed #818cf8; margin-left: 12px;">
                            %s
                        </span>
                    </div>
                    <p style="font-size: 15px; color: #4b5563; text-align: center; margin-bottom: 5px;">
                        Mã này sẽ hết hạn sau <b>10 phút</b>.
                    </p>
                    <p style="font-size: 14px; color: #9ca3af; text-align: center; margin-top: 20px;">
                        Nếu bạn không yêu cầu mã này, xin vui lòng bỏ qua email này. Tài khoản của bạn vẫn an toàn.
                    </p>
                </div>
                <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                    <p style="margin: 0; font-size: 13px; color: #6b7280;">
                        &copy; 2026 Axion Social Blog. All rights reserved.<br>
                        <a href="https://axion.id.vn" style="color: #4f46e5; text-decoration: none; margin-top: 5px; display: inline-block;">https://axion.id.vn</a>
                    </p>
                </div>
            </div>
            """;
            
            payload.put("html", String.format(htmlTemplate, otp));
            String json = mapper.writeValueAsString(payload);
            
            java.net.http.HttpClient client = java.net.http.HttpClient.newHttpClient();
            java.net.http.HttpRequest request = java.net.http.HttpRequest.newBuilder()
                .uri(java.net.URI.create("https://api.resend.com/emails"))
                .header("Authorization", "Bearer " + resendApiKey)
                .header("Content-Type", "application/json")
                .POST(java.net.http.HttpRequest.BodyPublishers.ofString(json))
                .build();
            java.net.http.HttpResponse<String> response = client.send(request, java.net.http.HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() >= 300) {
                System.err.println("Resend API failed: " + response.body());
                throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "EMAIL_FAILED", "Email service rejected the request: " + response.body());
            }
        } catch (ApiException e) {
            throw e;
        } catch (Exception e) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "EMAIL_FAILED", "Failed to send OTP email");
        }
    }

    @Transactional public TokenResponse register(RegisterRequest req){
        String email=normalize(req.email()); 
        if(users.existsByEmailIgnoreCase(email)) throw new ApiException(HttpStatus.CONFLICT,"EMAIL_ALREADY_EXISTS","Email is already registered");
        
        EmailOtp otpEntity = otps.findFirstByEmailAndUsedFalseOrderByExpiresAtDesc(email)
            .filter(o -> o.getExpiresAt().isAfter(Instant.now()))
            .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "INVALID_OTP", "OTP is invalid or expired"));
        
        if(!otpEntity.getOtp().equals(req.otp())) throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_OTP", "OTP is incorrect");
        otpEntity.markUsed();
        otps.save(otpEntity);

        UserAccount user=users.save(new UserAccount(email,passwords.encode(req.password()),req.displayName().trim()));
        outbox.save(events.userRegistered(user));
        return issue(user);
    }
    
    @Transactional public TokenResponse googleLogin(GoogleLoginRequest req) {
        try {
            java.net.http.HttpClient client = java.net.http.HttpClient.newHttpClient();
            java.net.http.HttpRequest request = java.net.http.HttpRequest.newBuilder()
                .uri(java.net.URI.create("https://oauth2.googleapis.com/tokeninfo?id_token=" + req.idToken()))
                .GET().build();
            java.net.http.HttpResponse<String> response = client.send(request, java.net.http.HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200) throw new ApiException(HttpStatus.UNAUTHORIZED, "INVALID_GOOGLE_TOKEN", "Invalid Google ID token");
            
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            com.fasterxml.jackson.databind.JsonNode node = mapper.readTree(response.body());
            
            if (googleClientId != null && !googleClientId.isBlank()) {
                String aud = node.has("aud") ? node.get("aud").asText() : "";
                if (!googleClientId.equals(aud)) throw new ApiException(HttpStatus.UNAUTHORIZED, "INVALID_GOOGLE_TOKEN", "Token audience mismatch");
            }

            String email = normalize(node.get("email").asText());
            String name = node.has("name") ? node.get("name").asText() : email.split("@")[0];
            
            Optional<UserAccount> userOpt = users.findByEmailIgnoreCase(email);
            UserAccount user;
            if (userOpt.isEmpty()) {
                user = users.save(new UserAccount(email, passwords.encode(UUID.randomUUID().toString()), name.trim()));
                outbox.save(events.userRegistered(user));
            } else {
                user = userOpt.get();
                if (user.getStatus() != UserAccount.Status.ACTIVE) throw new ApiException(HttpStatus.FORBIDDEN, "ACCOUNT_NOT_ACTIVE", "Account is not active");
            }
            return issue(user);
        } catch (ApiException e) {
            throw e;
        } catch (Exception e) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "GOOGLE_LOGIN_FAILED", "Failed to login with Google");
        }
    }

    @Transactional public TokenResponse login(LoginRequest req){
        Optional<UserAccount> userOpt=users.findByEmailIgnoreCase(normalize(req.email()));
        if(userOpt.isEmpty()){
            passwords.matches(req.password(), "$2a$10$00000000000000000000000000000000000000000000000000000"); // Dummy hash
            throw invalidCredentials();
        }
        UserAccount user=userOpt.get();
        if(!passwords.matches(req.password(),user.getPasswordHash())) throw invalidCredentials();
        if(user.getStatus()!=UserAccount.Status.ACTIVE) throw new ApiException(HttpStatus.FORBIDDEN,"ACCOUNT_NOT_ACTIVE","Account is not active");
        return issue(user);
    }
    @Transactional public TokenResponse refresh(RefreshRequest req){
        RefreshToken stored=refreshTokens.findByTokenHash(hash(req.refreshToken())).orElseThrow(this::invalidRefresh);
        if(!stored.isUsable()) throw invalidRefresh(); stored.revoke();
        UserAccount user=users.findById(stored.getUserId()).orElseThrow(this::invalidRefresh);
        if(user.getStatus()!=UserAccount.Status.ACTIVE) throw new ApiException(HttpStatus.FORBIDDEN,"ACCOUNT_NOT_ACTIVE","Account is not active");
        return issue(user);
    }
    @Transactional public void logout(RefreshRequest req){refreshTokens.findByTokenHash(hash(req.refreshToken())).ifPresent(RefreshToken::revoke);}
    private TokenResponse issue(UserAccount user){
        List<RefreshToken> existing = refreshTokens.findByUserIdOrderByCreatedAtAsc(user.getId());
        if(existing.size() >= 5) refreshTokens.delete(existing.get(0));
        byte[] bytes=new byte[48];random.nextBytes(bytes);String raw=Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        refreshTokens.save(new RefreshToken(user.getId(),hash(raw),Instant.now().plus(Duration.ofDays(refreshDays))));
        return new TokenResponse(jwt.create(user),raw,"Bearer",jwt.expiresInSeconds());
    }
    private String normalize(String email){return email.trim().toLowerCase(Locale.ROOT);}
    private ApiException invalidCredentials(){return new ApiException(HttpStatus.UNAUTHORIZED,"INVALID_CREDENTIALS","Email or password is incorrect");}
    private ApiException invalidRefresh(){return new ApiException(HttpStatus.UNAUTHORIZED,"INVALID_REFRESH_TOKEN","Refresh token is invalid or expired");}
    private String hash(String value){try{return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8)));}catch(NoSuchAlgorithmException e){throw new IllegalStateException(e);}}
}
