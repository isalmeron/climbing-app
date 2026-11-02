# S3 and embed links for exercise media

Exercise demonstrations are either **uploaded files stored in AWS S3** or
**embedded links** (YouTube/Vimeo URLs, GIF URLs) rendered by the app. Both
paths exist because trainers will have some videos on their phones (upload) and
some already on YouTube (link), and we don't want to force either workflow.

S3 is the locked-in part: it's the standard object store, cheap at this scale,
and avoids building any video-processing pipeline in v1. The model records a
demo as "uploaded media or a URL", so the choice is transparent to the rest of
the product.

## Consequences

- Introduces an AWS dependency (S3) and the need for bucket/CDN configuration
  when infrastructure is set up.
- No transcoding, thumbnails, or playback guarantees for uploaded files in v1 —
  the app delegates to the browser's native video/GIF rendering and to embedded
  players for links.
