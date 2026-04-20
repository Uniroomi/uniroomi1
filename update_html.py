import os
import re

base_dir = r"c:\Users\USER\Pictures\uniroomi\uniroomi1"

firebase_scripts_template = """
    <!-- Firebase SDK -->
    <script src="https://www.gstatic.com/firebasejs/8.6.1/firebase-app.js"></script>
    <script src="https://www.gstatic.com/firebasejs/8.6.1/firebase-auth.js"></script>
    <script src="https://www.gstatic.com/firebasejs/8.6.1/firebase-firestore.js"></script>
    <script src="https://www.gstatic.com/firebasejs/8.6.1/firebase-functions.js"></script>

    <!-- Firebase Configuration -->
    <script>
      const firebaseConfig = {{
        apiKey: "AIzaSyA4BFHNLe0LB0itiZ392YjefYPoDYznBdw",
        authDomain: "uniroomi-e1216.firebaseapp.com",
        projectId: "uniroomi-e1216",
        storageBucket: "uniroomi-e1216.appspot.com",
        messagingSenderId: "495800480757",
        appId: "1:495800480757:web:d2a02ba1c115c40c23e6bc"
      }};
      if (!firebase.apps.length) {{
          firebase.initializeApp(firebaseConfig);
      }}
    </script>

    <!-- Firebase Email Authentication -->
    <script src="{prefix}js/firebase-email-auth.js"></script>
"""

remove_regex = re.compile(r'<!-- Firebase SDK -->.*?(?=</body>)', re.IGNORECASE | re.DOTALL)
remove_regex2 = re.compile(r'<script src="https://www\.gstatic\.com/firebasejs/.*?(?=</body>)', re.IGNORECASE | re.DOTALL)

for root, dirs, files in os.walk(base_dir):
    for file in files:
        if file.endswith(".html"):
            file_path = os.path.join(root, file)
            rel_path = os.path.relpath(root, base_dir)
            if rel_path == ".":
                prefix = ""
            else:
                depth = len(rel_path.split(os.sep))
                prefix = "../" * depth
            
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()
            
            # Remove existing firebase scripts if any
            content = remove_regex.sub('', content)
            content = remove_regex2.sub('', content)
            content = re.sub(r'<script src="[^"]*firebase-email-auth\.js"></script>\s*', '', content)
            
            replacement = firebase_scripts_template.format(prefix=prefix)
            if '</body>' in content:
                content = content.replace('</body>', replacement + '  </body>')
            else:
                content += replacement
                
            with open(file_path, "w", encoding="utf-8") as f:
                f.write(content)

print("Done updating HTML files.")
