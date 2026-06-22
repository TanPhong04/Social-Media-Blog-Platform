package com.socialblog.user.api;
import com.socialblog.user.api.AuthDtos.*;
import com.socialblog.user.application.ProfileService;
import jakarta.validation.Valid;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import java.util.UUID;
@RestController @RequestMapping("/api/v1/users")
public class ProfileController {
    private final ProfileService service; public ProfileController(ProfileService service){this.service=service;}
    @GetMapping("/me") ProfileResponse me(@org.springframework.security.core.annotation.AuthenticationPrincipal Jwt jwt){return service.get(UUID.fromString(jwt.getSubject()));}
    @PutMapping("/me") ProfileResponse update(@org.springframework.security.core.annotation.AuthenticationPrincipal Jwt jwt,@Valid @RequestBody UpdateProfileRequest r){return service.update(UUID.fromString(jwt.getSubject()),r);}
}
