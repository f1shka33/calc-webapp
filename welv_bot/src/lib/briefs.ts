export type BriefKind =
  | "cover"
  | "vocal-mix"
  | "banner"
  | "tiktok"
  | "branding";

export type BriefInput = {
  artistName: string;
  trackName?: string;
  genre?: string;
  mood?: string;
  references?: string;
  desiredStyle?: string;
};

const HEADER = (artist: string, track?: string) =>
  [
    "===========================================",
    "      welv_bot · CREATIVE BRIEF",
    "===========================================",
    `Artist: ${artist || "—"}`,
    `Track:  ${track || "—"}`,
    `Date:   ${new Date().toISOString().slice(0, 10)}`,
    ""
  ].join("\n");

function bullets(label: string, value?: string) {
  if (!value) return "";
  return `• ${label}: ${value}\n`;
}

export function generateBrief(kind: BriefKind, input: BriefInput): string {
  const ctx =
    bullets("Genre", input.genre) +
    bullets("Mood", input.mood) +
    bullets("References", input.references) +
    bullets("Desired style", input.desiredStyle);

  switch (kind) {
    case "cover":
      return (
        HEADER(input.artistName, input.trackName) +
        "▸ DELIVERABLE\n" +
        "  One single cover artwork, 3000×3000 px, RGB, JPG + layered PSD.\n\n" +
        "▸ CONCEPT\n" +
        `  A cover that looks expensive, underground, and unforgettable. Mood: ${input.mood || "dark, luxurious, slightly cursed"}.\n` +
        `  The artwork should feel like a still from a banned music video.\n\n` +
        "▸ CONTEXT\n" +
        ctx +
        "\n▸ STYLE DIRECTION\n" +
        "  • Color palette: deep blacks, blood reds, brushed silver, occasional sickly green.\n" +
        "  • Texture: heavy grain, scanned-paper grit, light scanlines.\n" +
        "  • Typography: oversized condensed display type, kerning tight, treated like a poster.\n" +
        "  • Composition: hero subject centered or rule-of-thirds, generous negative space.\n\n" +
        "▸ MUST INCLUDE\n" +
        `  • Artist name "${input.artistName}" prominently.\n` +
        `  • Track title${input.trackName ? ` "${input.trackName}"` : ""} if applicable.\n` +
        "  • Subtle welv_bot watermark in bottom-right (only on placeholders).\n\n" +
        "▸ AVOID\n" +
        "  • Stock-feel photography, shiny vector gradients, generic AI art.\n" +
        "  • Centered logos that look like SaaS startups.\n\n" +
        "▸ DELIVERABLES\n" +
        "  • 3000×3000 master JPG, sRGB.\n" +
        "  • Layered PSD with editable type.\n" +
        "  • 1080×1080 social variant.\n"
      );

    case "vocal-mix":
      return (
        HEADER(input.artistName, input.trackName) +
        "▸ DELIVERABLE\n" +
        "  One mixed and lightly mastered vocal stem ready to drop into the track.\n\n" +
        "▸ TARGET SOUND\n" +
        `  ${input.desiredStyle || "Aggressive, present, expensive. Vocal sits forward but not brittle."}\n\n` +
        "▸ CONTEXT\n" +
        ctx +
        "\n▸ PROCESSING (suggested chain)\n" +
        "  1. HPF @ ~80 Hz → clean low rumble.\n" +
        "  2. Subtractive EQ — cut 250–400 Hz mud, surgical 2.8 kHz nasal.\n" +
        "  3. De-ess (FabFilter Pro-DS / Waves Sibilance) on 6–9 kHz.\n" +
        "  4. Compression: 1176-style for character (4:1, fast attack, medium release).\n" +
        "  5. Auto-Tune (or Melodyne) — retune speed depends on flow.\n" +
        "  6. Saturation: parallel grit bus (Decapitator / RC-20).\n" +
        "  7. Reverb send: short plate (0.8s) + dark hall (2.4s) for 'space'.\n" +
        "  8. Delay send: 1/4 dotted ping-pong, low-passed.\n" +
        "  9. Bus glue: SSL bus comp ~1 dB GR.\n\n" +
        "▸ DELIVERABLES\n" +
        "  • Mixed vocal stem (WAV 24-bit, 44.1 kHz).\n" +
        "  • FX-only stem.\n" +
        "  • Project file (FL Studio / Ableton / Logic).\n"
      );

    case "banner":
      return (
        HEADER(input.artistName, input.trackName) +
        "▸ DELIVERABLE\n" +
        "  SoundCloud banner: 2480×520 px (safe area 1240×260).\n\n" +
        "▸ CONCEPT\n" +
        "  A banner that makes an unsigned profile look like a sold-out tour. Cinematic, dark luxury.\n\n" +
        "▸ CONTEXT\n" +
        ctx +
        "\n▸ STYLE\n" +
        "  • Wide cinematic crop, heavy grain, faint red glow.\n" +
        "  • Type: condensed display, tracked tight, treated like poster art.\n" +
        "  • Subject: artist photo or symbolic object, photographed dark, single light source.\n\n" +
        "▸ DELIVERABLES\n" +
        "  • PSD with editable type.\n" +
        "  • PNG 2480×520 + 1240×260 mobile crop.\n"
      );

    case "tiktok":
      return (
        HEADER(input.artistName, input.trackName) +
        "▸ OBJECTIVE\n" +
        `  A 7-day TikTok plan to push "${input.trackName || "the new track"}" to the FYP for ${input.artistName}.\n\n` +
        "▸ HOOK FORMULAS (use 1 per post)\n" +
        "  • POV hook — \"POV: you just walked into ___ and this song is playing.\"\n" +
        "  • Wrong-answers hook — \"Tell me your worst ___ without telling me.\"\n" +
        "  • Reveal hook — \"Wait for it…\" cut on the drop.\n" +
        "  • Co-sign hook — green-screen a comment / DM and react.\n" +
        "  • Story-time hook — \"Made this song the day I ___.\"\n" +
        "  • Behind-the-scenes hook — short studio clip + caption claim.\n" +
        "  • Stitch hook — stitch a viral creator with the drop.\n\n" +
        "▸ POSTING SCHEDULE\n" +
        "  Day 1 — POV hook · 12s · drop at 4s.\n" +
        "  Day 2 — Studio BTS · 9s · raw sound.\n" +
        "  Day 3 — Reveal hook · 14s · slow burn.\n" +
        "  Day 4 — Story-time · 18s · vertical face cam.\n" +
        "  Day 5 — Wrong-answers · 11s · text-over-video.\n" +
        "  Day 6 — Stitch a viral creator · 10s.\n" +
        "  Day 7 — Co-sign reaction · 12s.\n\n" +
        "▸ CAPTION FRAMEWORK\n" +
        "  [insider claim] + [emotion] + [3 niche hashtags] + [1 broad hashtag]\n\n" +
        "▸ KPIs\n" +
        "  • Avg watch-time > 60% of video length.\n" +
        "  • Saves > Likes is the goal.\n" +
        "  • At least one post hits >2× your usual reach by day 5.\n" +
        "  • Bio link → SoundCloud, not Linktree.\n"
      );

    case "branding":
      return (
        HEADER(input.artistName, input.trackName) +
        "▸ OBJECTIVE\n" +
        `  Build a complete identity system for ${input.artistName} that signals dark luxury, underground credibility,\n  and immediate recognizability.\n\n` +
        "▸ CONTEXT\n" +
        ctx +
        "\n▸ DELIVERABLES\n" +
        "  • Primary logotype (display, condensed).\n" +
        "  • Logo monogram (single glyph mark).\n" +
        "  • Type pairing (display + body).\n" +
        "  • Color palette (3 core, 2 accent, 1 paper).\n" +
        "  • Cover-art template, banner template, single-release template.\n" +
        "  • Press shot direction (lighting, wardrobe, location notes).\n\n" +
        "▸ TONE OF VOICE\n" +
        "  Short, declarative, slightly menacing. Always lowercase outside of brand-name moments.\n" +
        "  Sample: \"buy digital weapons. drop music. become unavoidable.\"\n\n" +
        "▸ DON\\'T\n" +
        "  • Cute mascots, gradients, modern SaaS styling.\n" +
        "  • Corporate sans-serifs (Helvetica Neue).\n"
      );
  }
}
