import { apiFetch } from "@/lib/apiClient";
import type {
  CreateDraftResponse,
  PresignRequest,
  PresignResponse,
  ConfirmContentRequest,
  UpdateKnowPostRequest,
  FeedResponse,
  KnowpostDetailResponse,
  LikeActionResponse,
  FavActionResponse,
  CounterResponse,
  VisibleScope
} from "@/types/knowpost";

const KNOWPOST_PREFIX = "/api/v1/knowposts";
const STORAGE_PREFIX = "/api/v1/storage";

export const knowpostService = {
  createDraft: () =>
    apiFetch<CreateDraftResponse>(`${KNOWPOST_PREFIX}/drafts`, { method: "POST" }),

  presign: (payload: PresignRequest) =>
    apiFetch<PresignResponse>(`${STORAGE_PREFIX}/presign`, { method: "POST", body: JSON.stringify(payload) }),

  confirmContent: (id: string, payload: ConfirmContentRequest) =>
    apiFetch<void>(`${KNOWPOST_PREFIX}/${id}/content/confirm`, { method: "POST", body: JSON.stringify(payload) }),

  update: (id: string, payload: UpdateKnowPostRequest) =>
    apiFetch<void>(`${KNOWPOST_PREFIX}/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),

  publish: (id: string) =>
    apiFetch<void>(`${KNOWPOST_PREFIX}/${id}/publish`, { method: "POST" })
  ,
  
  // 设置置顶（需鉴权）
  setTop: (id: string, isTop: boolean) =>
    apiFetch<void>(`${KNOWPOST_PREFIX}/${id}/top`, {
      method: "PATCH",
      body: JSON.stringify({ isTop }),
    })
  ,

  // 设置可见性（需鉴权）
  setVisibility: (id: string, visible: VisibleScope) =>
    apiFetch<void>(`${KNOWPOST_PREFIX}/${id}/visibility`, {
      method: "PATCH",
      body: JSON.stringify({ visible }),
    })
  ,

  // 删除知文（需鉴权）
  remove: (id: string) =>
    apiFetch<void>(`${KNOWPOST_PREFIX}/${id}`, {
      method: "DELETE",
    })
  ,

  // 获取首页 Feed 列表（公开内容）
  feed: (page = 1, size = 20) =>
    apiFetch<FeedResponse>(`${KNOWPOST_PREFIX}/feed?page=${page}&size=${size}`)
  ,

  // 获取关注流（需鉴权）
  followingFeed: (page = 1, size = 20) =>
    apiFetch<FeedResponse>(`${KNOWPOST_PREFIX}/following?page=${page}&size=${size}`)
  ,

  // 获取我的知文（需鉴权）
  mine: (page = 1, size = 20) =>
    apiFetch<FeedResponse>(`${KNOWPOST_PREFIX}/mine?page=${page}&size=${size}`)
  ,

  // 获取某用户公开知文
  userPosts: (userId: number, page = 1, size = 20) =>
    apiFetch<FeedResponse>(`${KNOWPOST_PREFIX}/users/${userId}?page=${page}&size=${size}`, {
      skipAuth: true,
    })
  ,

  // 获取知文详情（公开内容无需鉴权；非公开需要作者凭证）
  detail: (id: string, accessToken?: string) =>
    apiFetch<KnowpostDetailResponse>(`${KNOWPOST_PREFIX}/detail/${id}`, {
      skipAuth: !accessToken
    })
  ,

  // 生成知文摘要（需鉴权）
  suggestDescription: (content: string) =>
    apiFetch<{ description: string }>(`${KNOWPOST_PREFIX}/description/suggest`, {
      method: "POST",
      body: JSON.stringify({ content }),
    })
  ,

  // 点赞/取消点赞（需鉴权）
  like: (entityId: string, entityType: string = "knowpost") =>
    apiFetch<LikeActionResponse>(`/api/v1/action/like`, {
      method: "POST",
      body: JSON.stringify({ entityType, entityId }),
    })
  ,
  unlike: (entityId: string, entityType: string = "knowpost") =>
    apiFetch<LikeActionResponse>(`/api/v1/action/unlike`, {
      method: "POST",
      body: JSON.stringify({ entityType, entityId }),
    })
  ,

  // 收藏/取消收藏（需鉴权）
  fav: (entityId: string, entityType: string = "knowpost") =>
    apiFetch<FavActionResponse>(`/api/v1/action/fav`, {
      method: "POST",
      body: JSON.stringify({ entityType, entityId }),
    })
  ,
  unfav: (entityId: string, entityType: string = "knowpost") =>
    apiFetch<FavActionResponse>(`/api/v1/action/unfav`, {
      method: "POST",
      body: JSON.stringify({ entityType, entityId }),
    })
  ,

  // 获取计数（需鉴权）
  counters: (entityId: string, entityType: string = "knowpost") =>
    apiFetch<CounterResponse>(`/api/v1/counter/${entityType}/${entityId}?metrics=like,fav`)
};

/**
 * 直传到预签名 URL。注意：S3/OSS 会在响应头返回 ETag。
 */
export async function uploadToPresigned(putUrl: string, headers: Record<string, string>, file: File) {
  const resp = await fetch(putUrl, {
    method: "PUT",
    headers,
    body: file,
    // 跨域上传通常不需要携带凭据
    credentials: "omit"
  });
  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new Error(text || `上传失败：${resp.status}`);
  }
  // ETag 常带双引号
  const etag = resp.headers.get("ETag") || resp.headers.get("etag") || "";
  return { etag };
}

export async function computeSha256(file: File) {
  const buf = typeof file.arrayBuffer === "function"
    ? await file.arrayBuffer()
    : await new Response(file).arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", buf);
  const hex = Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, "0")).join("");
  return hex;
}

export async function uploadMarkdownContent(postId: string, markdown: string) {
  const file = new File([markdown], `${postId}.md`, { type: "text/markdown;charset=utf-8" });
  const sha256 = await computeSha256(file);
  const presign = await knowpostService.presign({
    scene: "knowpost_content",
    postId,
    contentType: file.type,
    ext: ".md",
  });
  const uploaded = await uploadToPresigned(presign.putUrl, presign.headers, file);
  await knowpostService.confirmContent(postId, {
    objectKey: presign.objectKey,
    etag: uploaded.etag,
    size: file.size,
    sha256,
  });
  return presign.objectKey;
}
