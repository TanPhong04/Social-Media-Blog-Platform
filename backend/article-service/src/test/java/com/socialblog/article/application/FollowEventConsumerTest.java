package com.socialblog.article.application;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.socialblog.article.domain.FollowProjection;
import com.socialblog.article.repository.*;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.mockito.Mockito.*;

class FollowEventConsumerTest {
    @Test
    void projectsFollowEventsOnce() throws Exception {
        FollowProjectionRepository follows = mock(FollowProjectionRepository.class);
        ProcessedEventRepository processed = mock(ProcessedEventRepository.class);
        UUID event = UUID.randomUUID();
        UUID follower = UUID.randomUUID();
        UUID followed = UUID.randomUUID();
        when(processed.existsById(event)).thenReturn(false, true);

        FollowEventConsumer consumer = new FollowEventConsumer(new ObjectMapper(), follows, processed);
        String raw = "{\"eventId\":\"" + event + "\",\"eventType\":\"UserFollowed\",\"payload\":{\"followerId\":\"" + follower + "\",\"followedId\":\"" + followed + "\"}}";
        consumer.consume(raw);
        consumer.consume(raw);

        verify(follows, times(1)).save(argThat(f -> f.getId().followerId().equals(follower) && f.getId().followedId().equals(followed)));
        verify(processed, times(1)).save(any());
    }
}
