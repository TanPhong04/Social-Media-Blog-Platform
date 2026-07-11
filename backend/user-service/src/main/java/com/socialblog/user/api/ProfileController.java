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
    @GetMapping("/{id}") ProfileResponse getById(@PathVariable UUID id){return service.get(id);}
    @GetMapping("/suggestions")
    public java.util.List<ProfileResponse> getSuggestions(@org.springframework.security.core.annotation.AuthenticationPrincipal Jwt jwt) {
        return service.getSuggestions(UUID.fromString(jwt.getSubject()));
    }
    @PostMapping("/me/password")
    @ResponseStatus(org.springframework.http.HttpStatus.NO_CONTENT)
    public void changePassword(
            @org.springframework.security.core.annotation.AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody ChangePasswordRequest r
    ) {
        service.changePassword(UUID.fromString(jwt.getSubject()), r);
    }
}
