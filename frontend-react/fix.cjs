const fs = require('fs');

const p1 = 'src/components/feed/ArticleLikersModal.tsx';
let c1 = fs.readFileSync(p1, 'utf8');
c1 = c1.replace(/import { X, Heart, Repeat } from 'lucide-react';/, "import { Heart, Repeat } from 'lucide-react';");
fs.writeFileSync(p1, c1);

const p3 = 'src/components/ui/Tabs.tsx';
let c3 = fs.readFileSync(p3, 'utf8');
c3 = c3.replace(/import React, { useState, useRef, KeyboardEvent } from 'react';/, "import React, { useState, useRef } from 'react';\nimport type { KeyboardEvent } from 'react';");
c3 = c3.replace(/ref={el => tabRefs\.current\[index\] = el}/g, "ref={(el) => { tabRefs.current[index] = el; }}");
fs.writeFileSync(p3, c3);

const p4 = 'src/pages/ArticleDetail.tsx';
let c4 = fs.readFileSync(p4, 'utf8');
c4 = c4.replace(/import { ArrowLeft, MessageCircle, Heart, Share, Repeat, Bookmark, MoreHorizontal, Edit2, Trash2, Check } from 'lucide-react';/, "import { ArrowLeft, MessageCircle, Heart, Share, Repeat, Bookmark, MoreHorizontal } from 'lucide-react';");
fs.writeFileSync(p4, c4);

console.log('done');
