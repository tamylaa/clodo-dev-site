# Cloudflare DDoS Override: The Actual Solution

**Location**: Security > DDoS Mitigation > DDoS override > Create rule

---

## The Real Interface: DDoS L7 Ruleset Configuration

The DDoS override interface works differently than expected. It's about **configuring the ruleset behavior**, not creating expression-based rules.

### Current Screen Shows:

```
New DDoS override rule

Override name (Required)
[________________]

Override scope
Configure when to execute using a range of request parameters.
"DDoS L7 ruleset will execute"
└─ All incoming requests to clodo.dev

DDoS L7 ruleset configuration
├─ Ruleset action (Required): [Default ▼]
├─ Ruleset sensitivity (Required): [Default ▼]

Rule configuration
└─ Browse rules to configure action and status for specific tags or individual rules.
   "Tag or rule configurations have greater priority than ruleset configurations"
```

---

## The Problem with This Interface

**This interface controls global DDoS sensitivity, not bot-specific whitelisting.**

Options available:
- **Ruleset action**: Default, Log, Block, Bypass
- **Ruleset sensitivity**: Default, High, Medium, Low

**But there's no way to whitelist a specific bot by user agent in this interface.**

---

## Solution: Two Approaches

### Approach 1: Lower the Sensitivity (Might Help)

1. **Override name**: `Reduce DDoS Sensitivity for Audits`

2. **Ruleset action**: Leave as `Default` or try `Bypass`

3. **Ruleset sensitivity**: Change from `Default` to `Low` or `Medium`

4. **Deploy and test**

**Problem**: This reduces DDoS protection for EVERYONE, not just Lighthouse

**Upside**: Might allow Lighthouse through

---

### Approach 2: The Real Solution - Use Rule Configuration

At the bottom, it says:
> "Browse rules to configure action and status for specific tags or individual rules"

**This is what we need!** We should be able to:

1. Click **"Browse rules"** or **"Rule configuration"** button
2. Find rules related to "bot" or "headless"
3. Disable or bypass those specific rules for bot detection

**Look for**: 
- A button like "Configure individual rules" or "Browse rules"
- Or a section where you can select specific DDoS rules to override

---

## What To Do Right Now

On the form you're seeing:

1. **Override name**: 
   ```
   Whitelist Lighthouse Audits
   ```

2. **Override scope**: 
   - Keep as `All incoming requests to clodo.dev` ✅

3. **Ruleset action**:
   - Try: `Bypass` (this bypasses the entire DDoS L7 ruleset)
   - Or: `Log` (just logs, doesn't block)

4. **Ruleset sensitivity**:
   - Try: `Low` (least aggressive)

5. **Rule configuration**:
   - Look for buttons like:
     - "Configure individual rules"
     - "Browse rules"
     - "Specific rules"
   - Click to see if you can whitelist specific rules

6. **Deploy and test**

---

## Expected Behavior After Deploying

With `Bypass` action and `Low` sensitivity:
- The DDoS L7 ruleset won't block Lighthouse
- Real users will still be protected (other rulesets active)
- Lighthouse audit should complete
- Best Practices score should improve 79 → 95+

---

## Potential Issues with This Approach

**If "Bypass" is too aggressive**: It disables HTTP DDoS protection for everything, not just Lighthouse

**Better option (if available)**:
- Look for "Rule configuration" section
- Try to find bot/headless detection rules
- Disable ONLY those specific rules
- Keep other DDoS protection active

---

## Screenshot You Should Look For

After clicking "Create rule", look for sections like:

```
Rule configuration
├─ [ ] Definitely automated
├─ [ ] HTTP anomaly score check  
├─ [ ] Exposed Drupal REST API
├─ [ ] HTTP header anomalies
├─ [ ] HTTP DDoS Parameters
├─ [ ] Known bot traffic  ← THIS ONE? Or similar
├─ [ ] Cross-origin policy violation
└─ [More rules...]

[Disable] [Log] [Block]
```

If you see "Known bot traffic" or similar, **disable that rule** for this override.

---

## Next Steps

**Can you tell me**:
1. What options appear in the "Ruleset action" dropdown?
2. What options appear in the "Ruleset sensitivity" dropdown?
3. Do you see a button for "Rule configuration" or "Browse rules"?
4. If yes, what rules are listed?

With that info, I can give you the exact settings to choose.

---

## Quick Test Option

If all else fails, you could:
1. Set **Ruleset action** to `Bypass`
2. Set **Ruleset sensitivity** to `Low`
3. Click **Save/Deploy**
4. Wait 2 minutes
5. Run: `npm run lighthouse:audit`
6. Check if it works

This disables DDoS protection temporarily but will prove if that's the issue.

Then you could make it more targeted later.

---

**Status**: Awaiting your feedback on the dropdown options
**Time to complete**: 5 minutes (including propagation)
**Expected improvement**: 79/100 → 95/100 Best Practices
