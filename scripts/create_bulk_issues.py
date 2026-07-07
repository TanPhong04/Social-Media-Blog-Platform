import os
import subprocess
import time

issues = [
    ("setup: Initialize ReactJS project with Vite and Tailwind V4", "## Description\nSet up the base ReactJS project using Vite, configure Tailwind CSS v4, and establish the folder structure.\n## Tasks\n- [ ] Run create-vite\n- [ ] Install Tailwind CSS\n- [ ] Create `src/components`, `src/pages`, `src/api` directories."),
    ("feat: Implement Axios HTTP Client with Interceptors", "## Description\nCreate a centralized Axios client to handle API requests and automatically inject JWT tokens.\n## Tasks\n- [ ] Create `axiosClient.ts`\n- [ ] Add request interceptor for JWT\n- [ ] Add response interceptor for 401 errors"),
    ("feat: Create standard Navigation Bar (Navbar)", "## Description\nImplement a responsive Navbar for the application.\n## Tasks\n- [ ] Add Logo\n- [ ] Add navigation links (Home, Login)\n- [ ] Make it sticky and responsive"),
    ("feat: Implement Login Page UI", "## Description\nDesign and implement the Login screen.\n## Tasks\n- [ ] Create email and password inputs\n- [ ] Add validation\n- [ ] Style with Dark Theme"),
    ("feat: Implement Registration Page UI", "## Description\nDesign and implement the Sign Up screen.\n## Tasks\n- [ ] Create email, password, and display name inputs\n- [ ] Add validation\n- [ ] Handle API integration"),
    ("feat: Implement AuthContext for Global State", "## Description\nManage user authentication state globally using React Context.\n## Tasks\n- [ ] Create `AuthContext.tsx`\n- [ ] Provide `login`, `register`, and `logout` functions\n- [ ] Persist state to LocalStorage"),
    ("feat: Create Protected Route Component", "## Description\nEnsure private pages cannot be accessed by unauthenticated users.\n## Tasks\n- [ ] Create `ProtectedRoute.tsx`\n- [ ] Check `isAuthenticated` flag\n- [ ] Redirect to `/login` if false"),
    ("feat: Implement Article Card Component", "## Description\nDesign a reusable card component to display individual articles in a list.\n## Tasks\n- [ ] Display author info and timestamp\n- [ ] Display title and excerpt\n- [ ] Display interaction counters (likes, comments)"),
    ("feat: Implement Home Feed Page", "## Description\nFetch and display a list of articles on the main page.\n## Tasks\n- [ ] Call `GET /api/v1/articles`\n- [ ] Map data to `ArticleCard` components\n- [ ] Implement loading skeleton"),
    ("feat: Implement Full Article Detail Page", "## Description\nAllow users to read the full content of an article.\n## Tasks\n- [ ] Fetch article by ID/Slug\n- [ ] Render rich text content\n- [ ] Display author details"),
    ("feat: Integrate Rich Text Editor for Writing Articles", "## Description\nProvide an editor for users to compose new articles.\n## Tasks\n- [ ] Install rich text editor library\n- [ ] Create `Editor.tsx` page\n- [ ] Submit content to `POST /api/v1/articles`"),
    ("feat: Implement Comment Section UI", "## Description\nAllow users to view and write comments on an article.\n## Tasks\n- [ ] Create comment input form\n- [ ] Display list of existing comments\n- [ ] Handle submission to `POST /api/v1/comments`"),
    ("feat: Implement Like (Interaction) Button", "## Description\nAllow users to like articles and comments.\n## Tasks\n- [ ] Create interactive heart button\n- [ ] Connect to `PUT /api/v1/interactions/...`"),
    ("feat: Implement User Profile Page", "## Description\nDisplay user information and their published content.\n## Tasks\n- [ ] Fetch user info\n- [ ] Display list of authored articles\n- [ ] Add Follow button"),
    ("infra: Configure Caddy Reverse Proxy for Frontend", "## Description\nSet up Caddy to serve the React application and proxy API requests.\n## Tasks\n- [ ] Create `Caddyfile`\n- [ ] Configure `reverse_proxy` to backend port 8080")
]

repo = "fudn-traltb-su26/b-i-t-p-nh-m-course-project-social-media-blog-platform"

for title, body in issues:
    with open("temp_body.md", "w", encoding="utf-8") as f:
        f.write(body)
    
    cmd = f'gh issue create --repo {repo} --title "{title}" --body-file temp_body.md'
    subprocess.run(cmd, shell=True)
    time.sleep(1)

if os.path.exists("temp_body.md"):
    os.remove("temp_body.md")
