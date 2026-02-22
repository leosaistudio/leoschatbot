# 🚀 מדריך דיפלוי - Hostinger VPS

## דרישות מוקדמות
- שרת Hostinger VPS עם Ubuntu
- Docker ו-Docker Compose מותקנים (כבר מותקנים אצלך)
- גישת SSH לשרת

---

## שלב 1: העלאת הפרויקט לשרת

### אופציה א' - עם Git (מומלץ):

1. **בשרת**, פתח Terminal דרך Hostinger ותריץ:
```bash
cd /root
git clone https://github.com/YOUR-USERNAME/website-chatbot.git
cd website-chatbot
```

### אופציה ב' - העלאה ידנית עם SCP:

1. **במחשב שלך**, פתח PowerShell בתיקיית הפרויקט:
```powershell
# דחיסת הפרויקט (בלי node_modules ו-.next)
tar --exclude='node_modules' --exclude='.next' --exclude='deploy.zip' --exclude='prisma/dev.db' -czf chatbot-deploy.tar.gz .
```

2. **העלאה לשרת**:
```powershell
scp chatbot-deploy.tar.gz root@92.113.26.3:/root/
```

3. **בשרת** (Terminal של Hostinger):
```bash
cd /root
mkdir -p website-chatbot
cd website-chatbot
tar -xzf ../chatbot-deploy.tar.gz
```

---

## שלב 2: הגדרת קובץ Environment

**בשרת**, ערוך את קובץ `.env.production`:

```bash
cd /root/website-chatbot
nano .env.production
```

**שנה את הערכים הבאים:**

```env
# שנה את זה לסיסמה חזקה!
MYSQL_ROOT_PASSWORD=YOUR_STRONG_PASSWORD_HERE
MYSQL_PASSWORD=YOUR_STRONG_PASSWORD_HERE

# שנה את ה-URL שלך (שים את ה-IP של השרת)
NEXTAUTH_SECRET="שים_כאן_מחרוזת_אקראית_ארוכה_מאוד"
NEXTAUTH_URL="http://92.113.26.3:3000"
NEXT_PUBLIC_APP_URL="http://92.113.26.3:3000"

# שים את מפתח ה-OpenAI שלך
OPENAI_API_KEY="sk-proj-XXXXX"

# !!! חשוב !!! ה-DATABASE_URL צריך להתאים לסיסמה שבחרת
DATABASE_URL="mysql://chatbot_user:YOUR_STRONG_PASSWORD_HERE@db:3306/chatbot_db"
```

> **💡 טיפ**: ליצירת NEXTAUTH_SECRET אקראי, הריצו:
> ```bash
> openssl rand -base64 32
> ```

שמירה ב-nano: `Ctrl+X` → `Y` → `Enter`

---

## שלב 3: הפעלה!

```bash
chmod +x deploy.sh
./deploy.sh
```

**זה הכל!** 🎉 הסקריפט עושה הכל אוטומטית:
- בונה את ה-Docker images
- מעלה MySQL
- מריץ את Prisma migrations
- מפעיל את האפליקציה

---

## שלב 4: יצירת משתמש Admin

```bash
docker compose exec app npx tsx scripts/create-admin.ts
```

---

## שלב 5: גישה לאתר

פתח בדפדפן:
```
http://92.113.26.3:3000
```

---

## 📌 פקודות שימושיות

| פקודה | מה עושה |
|--------|---------|
| `docker compose logs -f app` | צפייה בלוגים של האפליקציה |
| `docker compose logs -f db` | צפייה בלוגים של MySQL |
| `docker compose restart app` | הפעלה מחדש של האפליקציה |
| `docker compose down` | עצירת הכל |
| `docker compose up -d` | הפעלת הכל |
| `docker compose up -d --build` | בנייה מחדש והפעלה |

---

## 🔄 עדכון האפליקציה

כשיש שינויים חדשים:

```bash
cd /root/website-chatbot
git pull                              # (אם משתמש ב-Git)
docker compose up -d --build          # בנייה מחדש  
docker compose exec app npx prisma db push   # עדכון DB אם יש שינויים
```

---

## 🔧 פתרון בעיות

### האפליקציה לא עולה
```bash
docker compose logs app
```

### MySQL לא מתחבר
```bash
docker compose logs db
# ודא שהסיסמה ב-DATABASE_URL תואמת ל-MYSQL_PASSWORD
```

### לאפס הכל ולהתחיל מחדש
```bash
docker compose down -v   # מוחק גם את ה-volumes (כולל DB!)
./deploy.sh
```

---

## 🌐 הוספת דומיין (אופציונלי - בהמשך)

כשתרצה להוסיף דומיין:
1. קנה דומיין ב-Hostinger
2. הפנה אותו ל-IP של השרת (A Record → `92.113.26.3`)
3. עדכן את `.env.production`:
   ```
   NEXTAUTH_URL="https://your-domain.com"
   NEXT_PUBLIC_APP_URL="https://your-domain.com"
   ```
4. הרץ מחדש: `docker compose up -d --build`
