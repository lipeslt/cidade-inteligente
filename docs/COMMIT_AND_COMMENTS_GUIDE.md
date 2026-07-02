# Commit & Code Comments Standard

## Commit Messages

### Format

```
<type>(<scope>): <short description>

[optional body]

[optional footer]
```

### Types

| Type       | When to use                                             |
| ---------- | ------------------------------------------------------- |
| `feat`     | New feature or capability                               |
| `fix`      | Bug fix                                                 |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `style`    | Formatting, whitespace, semicolons (no logic change)    |
| `docs`     | Documentation only                                      |
| `test`     | Adding or updating tests                                |
| `chore`    | Build config, dependencies, CI, tooling                 |
| `perf`     | Performance improvement                                 |
| `revert`   | Reverting a previous commit                             |

### Scope

The module or area affected. Use kebab-case:

| Scope       | Area                                      |
| ----------- | ----------------------------------------- |
| `animals`   | Animal pages, forms, components           |
| `tutors`    | Tutor pages, forms, components            |
| `dashboard` | Dashboard page                            |
| `ui`        | Shared UI components (modal, badge, etc.) |
| `data`      | Mock data, types, schemas                 |
| `routes`    | Routing config                            |
| `server`    | SSR, middleware, server entry             |
| `config`    | Vite, TS, ESLint, Bun config              |
| `deps`      | Dependency updates                        |

### Rules

1. Subject line: max **70 characters**, imperative mood, no period at end
2. Body (optional): wrap at 72 chars, explain _what_ and _why_ (not _how_)
3. Footer (optional): reference issues (`Closes #123`) or breaking changes (`BREAKING CHANGE: ...`)
4. One logical change per commit — do not mix unrelated changes

### Examples

```
feat(tutors): add tutor detail modal with data view

Display full tutor info (name, doc, email, phone, city) in a
centered modal when clicking a table row.
```

```
fix(ui): fix modal footer appearing in middle of content

Set max-h on DialogContent and use flex-1 overflow-y-auto on the
scrollable area so the footer stays pinned at the bottom.
```

```
refactor(animals): replace drawer with modal container

Migrate AnimalDrawer (Sheet-based) to AnimalFormModal using the
shared ModalContainer component for visual consistency.
```

```
chore(deps): install fast-check for property-based testing
```

```
docs: add technical maintenance documentation
```

---

## Code Comments

### Principles

1. **Comment the why, not the what** — code should be self-explanatory for _what_ it does
2. **Keep comments up to date** — stale comments are worse than no comments
3. **Write in English** — match the codebase language
4. **Be concise** — one line if possible, multi-line only when necessary

### Styles

#### Single-line

```typescript
// Fallback to phone when email is missing
const contact = tutor.email || tutor.telefone;
```

#### Section headers (within a component/file)

```typescript
/* ─── State ─────────────────────────────────────── */
const [modalState, setModalState] = useState<ModalState>({ mode: "closed" });

/* ─── Handlers ──────────────────────────────────── */
const openCreate = () => setModalState({ mode: "create" });
```

#### JSDoc (exported functions, components, types)

```typescript
/**
 * Reusable centered modal wrapper built on top of Radix Dialog.
 * Provides fixed header, scrollable content area, and sticky footer.
 */
export function ModalContainer({ ... }: ModalContainerProps) { ... }
```

#### TODO / FIXME

```typescript
// TODO: replace mock data with API call when backend is ready
// FIXME: pagination resets when filter changes mid-page
```

#### Deprecation

```typescript
/**
 * @deprecated Use AnimalFormModal from "@/components/animal-form-modal" instead.
 * This component will be removed in a future version.
 */
export function AnimalDrawer() { ... }
```

### What NOT to Comment

```typescript
// BAD: obvious comments
const nome = ""; // set nome to empty string
setDrawerOpen(true); // open the drawer

// BAD: commented-out code (delete it, git has history)
// const oldValue = computeSomething();

// BAD: change log in code (use git log)
// Changed on 2025-01-15 by John
```

### When to Comment

| Situation                             | Comment?                     |
| ------------------------------------- | ---------------------------- |
| Non-obvious business rule             | Yes                          |
| Workaround for a known bug/limitation | Yes (link issue if possible) |
| Complex regex or algorithm            | Yes                          |
| Obvious getter/setter                 | No                           |
| Self-explanatory variable name        | No                           |
| Simple conditional                    | No                           |

---

## Branch Naming

```
<type>/<short-description>
```

Examples:

- `feat/tutor-management-modal`
- `fix/modal-footer-position`
- `docs/maintenance-guide`
- `chore/update-dependencies`

---

## Pull Request Title

Follow the same format as commit subject:

```
feat(tutors): add tutor CRUD with centered modal
```

PR description should include:

1. **Summary** — what changed and why
2. **Testing** — how it was verified
3. **Screenshots** — if UI changed
