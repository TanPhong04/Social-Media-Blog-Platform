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
    @Transactional public ProfileResponse update(UUID id,UpdateProfileRequest req){UserAccount u=find(id);u.updateProfile(req.displayName().trim(),req.bio(),req.avatarUrl());return map(u);}
    private UserAccount find(UUID id){return users.findById(id).orElseThrow(()->new ApiException(HttpStatus.NOT_FOUND,"USER_NOT_FOUND","User not found"));}
    private ProfileResponse map(UserAccount u){return new ProfileResponse(u.getId(),u.getEmail(),u.getDisplayName(),u.getBio(),u.getAvatarUrl(),u.getRole().name(),u.getCreatedAt());}
}

