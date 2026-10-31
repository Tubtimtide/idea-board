# Idea Board

A minimal, responsive idea board built with Next.js, TypeScript,
and Supabase PostgreSQL, deployed on Vercel Hobby.

Live app: https://idea-board-one.vercel.app

## Features

- Submit ideas with a title, description, and author nickname.
- Display the latest 100 ideas with vote counts.
- Vote once per idea per browser identifier.
- Store ideas and votes in PostgreSQL.
- No authentication or payments.

## 1. Prerequisites

Install a supported Node.js LTS release and npm.
Create GitHub, Supabase, and Vercel accounts.

Verify your local installation:

    node --version
    npm --version

Vercel Hobby is intended for personal, non-commercial projects.

## 2. Install the application

Clone this repository and install its dependencies:

    git clone https://github.com/Tubtimtide/idea-board.git
    cd idea-board
    npm ci

This repository is private, so GitHub access is required.

## 3. Set up Supabase

1. Create a free Supabase project.
2. Open its SQL Editor.
3. Copy the contents of supabase/schema.sql into a new query.
4. Run it once against a NEW, empty database.
5. Confirm that the query succeeds.

The existing lab database is already configured.
Do not rerun the initial schema against that database.

The schema creates:

- ideas: title, description, author_nickname, and creation time.
- votes: idea_id, voter_id, and creation time.
- A unique constraint on (idea_id, voter_id).
- A foreign key preventing votes for nonexistent ideas.
- Length constraints and required fields.
- Row Level Security on both tables.

## 4. Configure environment variables

Create .env.local in the project root, next to package.json.

Add these two variables, replacing the placeholder values:

    NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY

Find the Project ID in Supabase Project Settings > General.
Find the publishable key in Project Settings > API Keys.

Use a key starting with sb_publishable_.
Never put a secret key, service_role key, or database password
in a NEXT_PUBLIC_ variable or client-side code.

NEXT_PUBLIC_ values are included in the browser bundle.
The publishable key is intended for this use; database permissions
and RLS control access to data.

.env.local is excluded from Git.
Restart the development server after changing environment variables.

## 5. Run locally

    npm run dev

Open http://localhost:3000.

Verify each step before proceeding:

1. Submit an idea and confirm that it appears.
2. Refresh and confirm that the idea remains.
3. Vote and confirm that the count increases.
4. Vote again from the same browser.
5. Confirm that the duplicate-vote message appears
   and the count does not increase.
6. Narrow the browser window and check the mobile layout.

## 6. Database access and security

Visitors use the anon database role with a publishable API key.

Visitors may insert only the title, description, and nickname
columns of ideas. The insert policy permits public submissions,
while database constraints validate required fields and lengths.

Visitors have no direct table SELECT, UPDATE, or DELETE privileges.
They also have no direct INSERT privilege on votes.

Two narrowly scoped SECURITY DEFINER functions expose the
required operations:

- list_ideas(): returns idea content and aggregate vote counts.
- vote_idea(): inserts one idea/voter pair.

These functions execute with their owner's privileges.
They use an empty search_path and fully qualified table names.
General execution permission is revoked and anon is explicitly
granted permission to call them.

Raw voter identifiers are not exposed by the public read function.
Administrative access remains available through Supabase.

Voter identifiers are browser-generated UUIDs in localStorage.
The database prevents duplicate votes for the same identifier.
This is not proof of a person's identity: clearing browser data,
switching browsers, or creating another identifier allows another vote.
Localhost and the deployed website have separate browser storage.

This first version has no rate limiting or moderation.
It is suitable for a small lab demonstration, not an abuse-resistant
public voting system.

## 7. Check the production build

    npm run build
    npm audit --omit=dev

The lab build passed. At the time of verification, the production
dependency audit reported zero known vulnerabilities.
The full audit reported 16 moderate development dependency findings.
Recheck these reports as dependencies and advisories change.
Do not use npm audit fix --force without reviewing breaking changes.

## 8. Deploy on Vercel Hobby

1. Push the application source and package-lock.json to GitHub.
   Do not commit .env.local or node_modules.
2. Sign in to Vercel and create a new project.
3. Connect GitHub and import the idea-board repository.
4. Choose the Hobby plan, Next.js preset, and root directory ./.
5. Keep the default build and output settings.
6. Add both environment variables from section 4.
   Set them for Production and Preview.
7. Create the project and deploy.
   The optional Supabase integration is not required.
8. Wait for the deployment status to become Ready.
9. Open the production URL and repeat the submission and vote tests.

Environment variables must be configured before the build.
After changing them, redeploy so the browser bundle uses the new values.

## 9. Publish future updates

After reviewing and testing changes:

    git add .
    git commit -m "Describe the change"
    git push

Vercel automatically deploys updates pushed to the connected main branch.
Confirm that the latest deployment is Ready before checking the live site.

## Troubleshooting

- Missing environment variables: check .env.local location, exact
  variable names, and accidental invisible characters; then restart.
- Unable to load or submit: check the project URL, publishable key,
  SQL functions, table privileges, and RLS policies.
- GitHub asks for a password: use GitHub CLI browser authentication.
- If your GitHub CLI configuration uses a custom directory, set
  GH_CONFIG_DIR to that directory in the terminal before Git operations.
- Safari shows text without forms: exit Reader View.
  Command+Shift+R toggles Reader View; Command+R refreshes.
