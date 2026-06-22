package com.socialblog.user.api;
import com.socialblog.user.api.AuthDtos.*;
import com.socialblog.user.application.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
@RestController @RequestMapping("/api/v1/auth")
public class AuthController {
    private final AuthService service; public AuthController(AuthService service){this.service=service;}
    @PostMapping("/register") ResponseEntity<TokenResponse> register(@Valid @RequestBody RegisterRequest r){return ResponseEntity.status(HttpStatus.CREATED).body(service.register(r));}
    @PostMapping("/login") TokenResponse login(@Valid @RequestBody LoginRequest r){return service.login(r);}
    @PostMapping("/refresh") TokenResponse refresh(@Valid @RequestBody RefreshRequest r){return service.refresh(r);}
    @PostMapping("/logout") @ResponseStatus(HttpStatus.NO_CONTENT) void logout(@Valid @RequestBody RefreshRequest r){service.logout(r);}
}
