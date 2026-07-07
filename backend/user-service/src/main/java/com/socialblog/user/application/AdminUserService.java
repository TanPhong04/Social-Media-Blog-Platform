package com.socialblog.user.application;

import com.socialblog.user.api.AdminDtos.AdminUserResponse;
import com.socialblog.user.domain.UserAccount;
import com.socialblog.user.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@Transactional
public class AdminUserService {
    private final UserRepository repository;

    public AdminUserService(UserRepository repository) {
        this.repository = repository;
    }

    public Page<AdminUserResponse> getUsers(Pageable pageable) {
        return repository.findAll(pageable)
            .map(u -> new AdminUserResponse(u.getId(), u.getEmail(), u.getDisplayName(), u.getBio(), u.getAvatarUrl(), u.getRole().name(), u.getStatus().name(), u.getCreatedAt()));
    }

    public com.socialblog.user.api.AdminDtos.AdminUserStats getStats() {
        java.time.Instant startOfDay = java.time.LocalDate.now(java.time.ZoneId.of("UTC")).atStartOfDay(java.time.ZoneId.of("UTC")).toInstant();
        return new com.socialblog.user.api.AdminDtos.AdminUserStats(repository.count(), repository.countByStatus(UserAccount.Status.ACTIVE), repository.countByCreatedAtAfter(startOfDay));
    }

    public void suspendUser(UUID id) {
        UserAccount user = repository.findById(id).orElseThrow();
        user.suspend();
    }

    public void activateUser(UUID id) {
        UserAccount user = repository.findById(id).orElseThrow();
        user.activate();
    }

    public void deleteUser(UUID id) {
        UserAccount user = repository.findById(id).orElseThrow();
        user.delete();
    }
}
