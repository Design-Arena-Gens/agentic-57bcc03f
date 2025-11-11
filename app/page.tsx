"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

type GenerationPayload = {
  topic: string;
  targetAudience: string;
  outcome: string;
  tone: string;
};

type GeneratedPost = {
  headline: string;
  hook: string;
  talkingPoints: string[];
  body: string[];
  callToAction: string;
  hashtags: string[];
  palette: {
    gradientFrom: string;
    gradientTo: string;
    accent: string;
    textOnAccent: string;
  };
};

const tones = [
  { label: "Professional", value: "professional" },
  { label: "Energetic", value: "energetic" },
  { label: "Inspirational", value: "inspirational" },
  { label: "Analytical", value: "analytical" }
];

const defaultPayload: GenerationPayload = {
  topic: "",
  targetAudience: "",
  outcome: "",
  tone: tones[0].value
};

export default function Home() {
  const [payload, setPayload] = useState<GenerationPayload>(defaultPayload);
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoName, setLogoName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GeneratedPost | null>(null);
  const [isRenderingImage, setIsRenderingImage] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const canSubmit = useMemo(
    () =>
      payload.topic.trim().length > 0 &&
      payload.targetAudience.trim().length > 0 &&
      payload.outcome.trim().length > 0,
    [payload]
  );

  useEffect(() => {
    if (result) {
      void renderCanvas(result, logoDataUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result, logoDataUrl]);

  const handleFileUpload = (file: File | null) => {
    if (!file) {
      setLogoDataUrl(null);
      setLogoPreview(null);
      setLogoName(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setLogoDataUrl(dataUrl);
      setLogoPreview(dataUrl);
      setLogoName(file.name);
    };
    reader.readAsDataURL(file);
  };

  const renderCanvas = async (
    data: GeneratedPost,
    logo: string | null
  ): Promise<void> => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    setIsRenderingImage(true);
    canvas.width = 1080;
    canvas.height = 1080;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setIsRenderingImage(false);
      return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, data.palette.gradientFrom);
    gradient.addColorStop(1, data.palette.gradientTo);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
    ctx.fillRect(40, 40, canvas.width - 80, canvas.height - 80);

    const contentBoxX = 100;
    const contentBoxY = 140;
    const contentBoxWidth = canvas.width - contentBoxX * 2;

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 58px 'Inter', sans-serif";
    let currentY =
      contentBoxY +
      drawWrappedText(ctx, data.headline, contentBoxX, contentBoxY, contentBoxWidth, 70) +
      36;

    ctx.font = "500 28px 'Inter', sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
    currentY += drawWrappedText(
      ctx,
      data.hook,
      contentBoxX,
      currentY,
      contentBoxWidth,
      42
    );

    ctx.font = "600 30px 'Inter', sans-serif";
    ctx.fillStyle = data.palette.accent;
    currentY += 32;
    currentY += drawWrappedText(ctx, "Playbook", contentBoxX, currentY, contentBoxWidth, 40);

    ctx.font = "400 28px 'Inter', sans-serif";
    ctx.fillStyle = "#ffffff";
    let bulletY = currentY + 24;
    data.talkingPoints.forEach((point) => {
      ctx.fillText("•", contentBoxX, bulletY);
      const paragraphHeight = drawWrappedText(
        ctx,
        point,
        contentBoxX + 30,
        bulletY,
        contentBoxWidth - 30,
        36
      );
      bulletY += paragraphHeight + 28;
    });

    ctx.font = "500 26px 'Inter', sans-serif";
    ctx.fillStyle = data.palette.accent;
    const ctaY = canvas.height - 200;
    drawWrappedText(ctx, data.callToAction, contentBoxX, ctaY, contentBoxWidth, 38);

    ctx.font = "500 24px 'Inter', sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(data.hashtags.join("  "), contentBoxX, canvas.height - 80);

    if (logo) {
      try {
        const image = await loadImage(logo);
        const logoSize = 140;
        const maxLogoSize = Math.min(logoSize, canvas.width * 0.15);
        const logoX = canvas.width - maxLogoSize - 100;
        const logoY = contentBoxY;
        ctx.save();
        ctx.beginPath();
        if ("roundRect" in ctx) {
          ctx.roundRect(logoX, logoY, maxLogoSize, maxLogoSize, 24);
        } else {
          drawRoundedRect(ctx, logoX, logoY, maxLogoSize, maxLogoSize, 24);
        }
        ctx.clip();
        ctx.drawImage(
          image,
          logoX,
          logoY,
          maxLogoSize,
          maxLogoSize
        );
        ctx.restore();
      } catch (logoError) {
        console.error("Error rendering logo", logoError);
      }
    }

    setIsRenderingImage(false);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) {
      setError("Please provide topic, audience, and outcome.");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const body = await response.json();
        throw new Error(body.error ?? "Unable to generate post");
      }

      const json = (await response.json()) as GeneratedPost;
      setResult(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setPayload(defaultPayload);
    setResult(null);
    setLogoDataUrl(null);
    setLogoPreview(null);
    setLogoName(null);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const downloadImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const link = document.createElement("a");
    link.download = "linkedin-post.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <main className="page">
      <section className="pane input">
        <div className="header">
          <h1>LinkedIn Post Agent</h1>
          <p>Create polished LinkedIn-ready copy and visuals in one go.</p>
        </div>

        <form className="form" onSubmit={handleSubmit}>
          <label>
            Topic or Initiative
            <input
              type="text"
              value={payload.topic}
              onChange={(event) =>
                setPayload((prev) => ({ ...prev, topic: event.target.value }))
              }
              placeholder="e.g. Product-led onboarding flows"
            />
          </label>

          <label>
            Target Audience
            <input
              type="text"
              value={payload.targetAudience}
              onChange={(event) =>
                setPayload((prev) => ({
                  ...prev,
                  targetAudience: event.target.value
                }))
              }
              placeholder="e.g. SaaS revenue leaders"
            />
          </label>

          <label>
            Desired Outcome
            <input
              type="text"
              value={payload.outcome}
              onChange={(event) =>
                setPayload((prev) => ({
                  ...prev,
                  outcome: event.target.value
                }))
              }
              placeholder="e.g. Drive adoption of our onboarding playbook"
            />
          </label>

          <label>
            Tone
            <select
              value={payload.tone}
              onChange={(event) =>
                setPayload((prev) => ({ ...prev, tone: event.target.value }))
              }
            >
              {tones.map((toneOption) => (
                <option key={toneOption.value} value={toneOption.value}>
                  {toneOption.label}
                </option>
              ))}
            </select>
          </label>

          <label className="file-input">
            Brand Logo (optional)
            <div className="file-drop">
              <input
                type="file"
                accept="image/*"
                onChange={(event) => handleFileUpload(event.target.files?.[0] ?? null)}
              />
              <div className="file-drop__prompt">
                {logoPreview ? (
                  <>
                    <img src={logoPreview} alt="Logo preview" />
                    <span>{logoName}</span>
                  </>
                ) : (
                  <span>Upload PNG or SVG</span>
                )}
              </div>
            </div>
          </label>

          {error && <p className="error">{error}</p>}

          <div className="actions">
            <button type="submit" disabled={!canSubmit || isLoading}>
              {isLoading ? "Generating…" : "Generate Post"}
            </button>
            <button type="button" className="secondary" onClick={reset}>
              Reset
            </button>
          </div>
        </form>
      </section>

      <section className="pane output">
        <div className="output-header">
          <h2>Generated Copy</h2>
          <p>Copy-ready text, tailored to your inputs.</p>
        </div>

        {result ? (
          <div className="result">
            <div className="result-block">
              <h3>{result.headline}</h3>
              <p className="hook">{result.hook}</p>
              <ul>
                {result.talkingPoints.map((point, index) => (
                  <li key={index}>{point}</li>
                ))}
              </ul>
              {result.body.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
              <p className="cta">{result.callToAction}</p>
              <p className="hashtags">{result.hashtags.join(" ")}</p>
            </div>

            <div className="image-block">
              <div className="image-toolbar">
                <span>LinkedIn Visual</span>
                <div className="image-actions">
                  <button
                    type="button"
                    className="secondary"
                    onClick={() => result && renderCanvas(result, logoDataUrl)}
                    disabled={isRenderingImage}
                  >
                    {isRenderingImage ? "Rendering…" : "Refresh"}
                  </button>
                  <button type="button" onClick={downloadImage} disabled={isRenderingImage}>
                    Download PNG
                  </button>
                </div>
              </div>
              <canvas ref={canvasRef} aria-label="Generated LinkedIn image preview" />
            </div>
          </div>
        ) : (
          <div className="placeholder">
            <p>Bring your idea, audience, and outcome to life with tailored posts.</p>
            <p className="hint">Your generated copy and visual will appear here.</p>
          </div>
        )}
      </section>
    </main>
  );
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = (event) =>
      reject(new Error(`Failed to load image: ${(event as ErrorEvent).message}`));
    image.src = url;
  });
}

function drawWrappedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
): number {
  if (!text.trim()) {
    return 0;
  }

  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  words.forEach((word) => {
    const testLine = `${currentLine}${word} `.trim();
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine.trim());
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  });

  if (currentLine.trim().length > 0) {
    lines.push(currentLine.trim());
  }

  lines.forEach((line, index) => {
    ctx.fillText(line, x, y + index * lineHeight);
  });

  return lines.length * lineHeight;
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}
