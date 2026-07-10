package com.socialblog.user.application;
import com.socialblog.user.api.ApiException;
import com.socialblog.user.api.AuthDtos.*;
import com.socialblog.user.domain.UserAccount;
import com.socialblog.user.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.UUID;
@Service
public class ProfileService {
    private final UserRepository users; public ProfileService(UserRepository users){this.users=users;}
    @Transactional(readOnly=true) public ProfileResponse get(UUID id){return map(find(id));}
    @Transactional public ProfileResponse update(UUID id,UpdateProfileRequest req){
        String username = req.username().trim().toLowerCase();
        if (users.existsByUsernameIgnoreCaseAndIdNot(username, id)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "USERNAME_ALREADY_EXISTS", "Tên tài khoản này đã được sử dụng bởi người khác.");
        }
        UserAccount u=find(id);
        u.updateProfile(req.displayName().trim(), req.bio(), req.avatarUrl(), username, req.dob());
        return map(u);
    }
    @Transactional(readOnly=true)
    public java.util.List<ProfileResponse> getSuggestions(UUID currentUserId) {
        return users.findAll().stream()
            .filter(u -> !u.getId().equals(currentUserId))
            .limit(30)
            .map(this::map)
            .collect(java.util.stream.Collectors.toList());
    }
    private UserAccount find(UUID id){return users.findById(id).orElseThrow(()->new ApiException(HttpStatus.NOT_FOUND,"USER_NOT_FOUND","User not found"));}
    private ProfileResponse map(UserAccount u){return new ProfileResponse(u.getId(),u.getEmail(),u.getDisplayName(),u.getBio(),u.getAvatarUrl(),u.getRole().name(),u.getUsername(),u.getDob(),u.getCreatedAt());}
}

