import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:image_picker/image_picker.dart';
import 'package:video_player/video_player.dart';
import '../../domain/models/article_model.dart';
import '../../data/article_repository.dart';
import '../providers/feed_provider.dart';

class CreateArticleScreen extends ConsumerStatefulWidget {
  final ArticleModel? editArticle;

  const CreateArticleScreen({super.key, this.editArticle});

  @override
  ConsumerState<CreateArticleScreen> createState() => _CreateArticleScreenState();
}

class _CreateArticleScreenState extends ConsumerState<CreateArticleScreen> {
  final _contentController = TextEditingController();
  final ImagePicker _picker = ImagePicker();
  
  bool _isPosting = false;
  final List<File> _selectedImages = [];
  File? _selectedVideo;
  VideoPlayerController? _videoController;
  double _uploadProgress = 0.0;

  @override
  void initState() {
    super.initState();
    if (widget.editArticle != null) {
      _contentController.text = widget.editArticle!.content.isNotEmpty ? widget.editArticle!.content : widget.editArticle!.summary;
    }
  }

  @override
  void dispose() {
    _contentController.dispose();
    _videoController?.dispose();
    super.dispose();
  }

  Future<void> _pickMedia(bool isVideo, ImageSource source) async {
    try {
      if (isVideo) {
        final XFile? pickedFile = await _picker.pickVideo(source: source, maxDuration: const Duration(minutes: 5));
        if (pickedFile != null) {
          final file = File(pickedFile.path);
          final size = await file.length();
          if (size > 50 * 1024 * 1024) {
            if (!mounted) return;
            ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('File quá lớn. Vui lòng chọn file nhỏ hơn 50MB.')));
            return;
          }
          setState(() {
            _selectedImages.clear();
            _selectedVideo = file;
          });
          _videoController?.dispose();
          _videoController = VideoPlayerController.file(_selectedVideo!)
            ..initialize().then((_) {
              if (mounted) setState(() {});
            });
        }
      } else {
        if (source == ImageSource.gallery) {
          final List<XFile> pickedFiles = await _picker.pickMultiImage();
          if (pickedFiles.isNotEmpty) {
            for (var picked in pickedFiles) {
              final size = await File(picked.path).length();
              if (size > 50 * 1024 * 1024) {
                if (!mounted) return;
                ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Một số ảnh quá lớn. Vui lòng chọn ảnh nhỏ hơn 50MB.')));
                return;
              }
            }
            setState(() {
              _selectedVideo = null;
              _videoController?.dispose();
              _videoController = null;
              _selectedImages.addAll(pickedFiles.map((x) => File(x.path)));
            });
          }
        } else {
          final XFile? pickedFile = await _picker.pickImage(source: source);
          if (pickedFile != null) {
            final file = File(pickedFile.path);
            final size = await file.length();
            if (size > 50 * 1024 * 1024) {
              if (!mounted) return;
              ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Ảnh quá lớn.')));
              return;
            }
            setState(() {
              _selectedVideo = null;
              _videoController?.dispose();
              _videoController = null;
              _selectedImages.add(file);
            });
          }
        }
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Lỗi truy cập media: $e')));
    }
  }

  Future<void> _handlePost() async {
    final text = _contentController.text.trim();
    if (text.isEmpty && _selectedImages.isEmpty && _selectedVideo == null && widget.editArticle == null) return;

    setState(() {
      _isPosting = true;
      _uploadProgress = 0.0;
    });

    try {
      String? mediaUrl;
      final repo = ref.read(articleRepositoryProvider);

      if (_selectedVideo != null) {
        final url = await repo.uploadMedia(
          _selectedVideo!.path,
          onSendProgress: (count, total) {
            if (mounted) setState(() => _uploadProgress = count / total);
          }
        );
        mediaUrl = '$url#video';
      } else if (_selectedImages.isNotEmpty) {
        List<String> uploadedUrls = [];
        for (int i = 0; i < _selectedImages.length; i++) {
          final url = await repo.uploadMedia(
            _selectedImages[i].path,
            onSendProgress: (count, total) {
              if (mounted) setState(() => _uploadProgress = ((i * total) + count) / (_selectedImages.length * total));
            }
          );
          uploadedUrls.add(url);
        }
        mediaUrl = uploadedUrls.join(',');
      } else if (widget.editArticle != null) {
        mediaUrl = widget.editArticle!.mediaUrl;
      }

      final lines = text.isNotEmpty ? text.split('\n') : ['Bài viết mới'];
      final title = lines.first.length > 50 ? lines.first.substring(0, 50) : lines.first;
      final summary = text.length > 150 ? '${text.substring(0, 150)}...' : text;
      
      List<String> tags = RegExp(r'#(\w+)').allMatches(text).map((e) => e.group(1)!).toList();
      if (_selectedVideo != null && _selectedImages.isEmpty && !tags.contains('reel')) {
        tags.add('reel');
      }
      
      if (widget.editArticle != null) {
        await repo.updateArticle(widget.editArticle!.id, title, summary, text, tags, mediaUrl: mediaUrl);
      } else {
        await repo.createArticle(title, summary, text, tags, mediaUrl: mediaUrl);
      }
      
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(widget.editArticle != null ? 'Đã cập nhật bài viết!' : 'Đã đăng bài viết!')));
      
      ref.read(feedProvider.notifier).refresh();
      Navigator.pop(context);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Lỗi: $e')));
    } finally {
      if (mounted) setState(() => _isPosting = false);
    }
  }

  void _showMediaPicker() {
    showModalBottomSheet(
      context: context,
      builder: (context) => SafeArea(
        child: Wrap(
          children: [
            ListTile(
              leading: const Icon(Icons.camera_alt_outlined),
              title: const Text('Chụp ảnh'),
              onTap: () {
                Navigator.pop(context);
                _pickMedia(false, ImageSource.camera);
              },
            ),
            ListTile(
              leading: const Icon(Icons.image_outlined),
              title: const Text('Chọn ảnh từ thư viện'),
              onTap: () {
                Navigator.pop(context);
                _pickMedia(false, ImageSource.gallery);
              },
            ),
            ListTile(
              leading: const Icon(Icons.videocam_outlined),
              title: const Text('Quay video'),
              onTap: () {
                Navigator.pop(context);
                _pickMedia(true, ImageSource.camera);
              },
            ),
            ListTile(
              leading: const Icon(Icons.folder_outlined),
              title: const Text('Chọn video từ thư viện'),
              onTap: () {
                Navigator.pop(context);
                _pickMedia(true, ImageSource.gallery);
              },
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Tạo bài viết'),
        actions: [
          Padding(
            padding: const EdgeInsets.all(8.0),
            child: FilledButton(
              onPressed: _isPosting ? null : _handlePost,
              child: _isPosting && _uploadProgress == 0.0
                ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                : const Text('Đăng'),
            ),
          ),
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            if (_isPosting && _uploadProgress > 0)
              LinearProgressIndicator(value: _uploadProgress),
            Expanded(
              child: ListView(
                children: [
                  TextField(
                    controller: _contentController,
                    maxLines: null,
                    autofocus: true,
                    decoration: const InputDecoration(
                      hintText: 'Có chuyện gì thế?',
                      border: InputBorder.none,
                    ),
                    style: const TextStyle(fontSize: 18),
                  ),
                  const SizedBox(height: 16),
                  if (_selectedVideo != null)
                    Stack(
                      children: [
                        ClipRRect(
                          borderRadius: BorderRadius.circular(12),
                          child: _videoController != null && _videoController!.value.isInitialized
                              ? AspectRatio(
                                  aspectRatio: _videoController!.value.aspectRatio,
                                  child: Stack(
                                    alignment: Alignment.center,
                                    children: [
                                      VideoPlayer(_videoController!),
                                      IconButton(
                                        icon: Icon(
                                          _videoController!.value.isPlaying ? Icons.pause : Icons.play_arrow,
                                          color: Colors.white,
                                          size: 40,
                                        ),
                                        onPressed: () {
                                          setState(() {
                                            _videoController!.value.isPlaying ? _videoController!.pause() : _videoController!.play();
                                          });
                                        },
                                      ),
                                    ],
                                  ),
                                )
                              : const SizedBox(height: 200, child: Center(child: CircularProgressIndicator())),
                        ),
                        Positioned(
                          top: 8,
                          right: 8,
                          child: CircleAvatar(
                            backgroundColor: Colors.black54,
                            child: IconButton(
                              icon: const Icon(Icons.close, color: Colors.white),
                              onPressed: () {
                                setState(() {
                                  _selectedVideo = null;
                                  _videoController?.dispose();
                                  _videoController = null;
                                });
                              },
                            ),
                          ),
                        ),
                      ],
                    ),
                  if (_selectedImages.isNotEmpty)
                    GridView.builder(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: 2,
                        crossAxisSpacing: 8,
                        mainAxisSpacing: 8,
                      ),
                      itemCount: _selectedImages.length,
                      itemBuilder: (context, index) => Stack(
                        children: [
                          Positioned.fill(
                            child: ClipRRect(
                              borderRadius: BorderRadius.circular(12),
                              child: Image.file(_selectedImages[index], fit: BoxFit.cover),
                            ),
                          ),
                          Positioned(
                            top: 4,
                            right: 4,
                            child: CircleAvatar(
                              backgroundColor: Colors.black54,
                              radius: 14,
                              child: IconButton(
                                padding: EdgeInsets.zero,
                                icon: const Icon(Icons.close, color: Colors.white, size: 16),
                                onPressed: () {
                                  setState(() {
                                    _selectedImages.removeAt(index);
                                  });
                                },
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),

                ],
              ),
            ),
            const Divider(),
            Row(
              children: [
                IconButton(icon: const Icon(Icons.image_outlined, color: Colors.green), onPressed: _showMediaPicker),
                IconButton(icon: const Icon(Icons.emoji_emotions_outlined, color: Colors.yellow), onPressed: () {}),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

