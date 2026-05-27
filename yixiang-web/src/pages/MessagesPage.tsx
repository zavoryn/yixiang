import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Send, MessageSquare, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { messageService } from '@/services/messageService';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/ui/button';
import { formatRelativeTime } from '@/lib/formatters';
import { buildSseUrl } from '@/lib/sse';
import { useAuth } from '@/context/AuthContext';
import type { ConversationDto, MessageDto } from '@/types/message';

export default function MessagesPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { convId: convIdParam } = useParams<{ convId?: string }>();
  const [activeConvId, setActiveConvId] = useState<number | null>(
    convIdParam ? Number(convIdParam) : null
  );
  const { tokens } = useAuth();

  const queryClient = useQueryClient();

  // If ?targetUserId=X is passed (from ProfilePage), start or find conversation
  const targetUserId = searchParams.get('targetUserId');

  const { data: conversations = [], isLoading: convsLoading } = useQuery<ConversationDto[]>({
    queryKey: ['messages', 'conversations'],
    queryFn: () => messageService.listConversations(),
    refetchInterval: 60_000,
  });

  useEffect(() => {
    if (!tokens?.accessToken) return;
    const es = new EventSource(buildSseUrl(messageService.streamPath(), tokens?.accessToken ?? null));
    es.addEventListener('message', (event) => {
      let convId: number | null = null;
      try {
        const payload = JSON.parse((event as MessageEvent).data) as { convId?: number };
        convId = typeof payload.convId === 'number' ? payload.convId : null;
      } catch {
        convId = null;
      }
      queryClient.invalidateQueries({ queryKey: ['messages', 'conversations'] });
      queryClient.invalidateQueries({ queryKey: ['messages', 'unread'] });
      if (convId != null) {
        queryClient.invalidateQueries({ queryKey: ['messages', convId] });
      }
    });
    es.onerror = () => undefined;
    return () => es.close();
  }, [queryClient, tokens?.accessToken]);

  const startConvMutation = useMutation({
    mutationFn: (targetId: number) => messageService.startConversation(targetId),
    onSuccess: (conv) => {
      queryClient.invalidateQueries({ queryKey: ['messages', 'conversations'] });
      setActiveConvId(conv.id);
    },
  });

  const startedRef = useRef(false);
  useEffect(() => {
    if (targetUserId && !startedRef.current) {
      startedRef.current = true;
      startConvMutation.mutate(Number(targetUserId));
    }
  }, [targetUserId, startConvMutation]);

  const activeConv = conversations.find((c) => c.id === activeConvId);

  return (
    <div className="flex h-[calc(100vh-64px)] bg-white border-l border-r border-gray-100 mx-auto max-w-5xl shadow-sm">
      {/* Left panel: conversation list */}
      <div className="w-[320px] border-r border-gray-100 flex flex-col shrink-0">
        <div className="p-4 border-b border-gray-100">
          <h1 className="text-lg font-bold text-gray-900">私信</h1>
        </div>

        <div className="flex-1 overflow-y-auto">
          {convsLoading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="w-10 h-10 rounded-full shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <EmptyState icon={MessageSquare} title="暂无私信" description="从用户主页发起私信" />
            </div>
          ) : (
            conversations.map((conv) => (
              <ConvListItem
                key={conv.id}
                conv={conv}
                isActive={conv.id === activeConvId}
                onClick={() => setActiveConvId(conv.id)}
              />
            ))
          )}
        </div>
      </div>

      {/* Right panel: message thread */}
      <div className="flex-1 flex flex-col min-w-0">
        {activeConvId && activeConv ? (
          <MessageThread
            conv={activeConv}
            convId={activeConvId}
            onBack={() => setActiveConvId(null)}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <EmptyState
              icon={MessageSquare}
              title="选择一个会话"
              description="从左侧选择会话，或前往用户主页发起私信"
              action={<Button onClick={() => navigate(-1)}>返回</Button>}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function ConvListItem({
  conv, isActive, onClick,
}: {
  conv: ConversationDto;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50 ${
        isActive ? 'bg-blue-50 border-l-2 border-blue-500' : ''
      }`}
      onClick={onClick}
    >
      <div className="relative shrink-0">
        <img
          src={conv.otherAvatar || `https://i.pravatar.cc/150?u=${conv.otherUserId}`}
          className="w-10 h-10 rounded-full object-cover"
          alt={conv.otherNickname}
        />
        {conv.otherVerified && (
          <CheckCircle2 size={14} className="absolute -bottom-0.5 -right-0.5 text-blue-500 fill-blue-500 bg-white rounded-full" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <span className="text-sm font-semibold text-gray-900 truncate">{conv.otherNickname}</span>
          <span className="text-[11px] text-gray-400 shrink-0 ml-2">
            {conv.lastMsgAt ? formatRelativeTime(conv.lastMsgAt) : ''}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400 truncate">{conv.lastMsgPreview || '开始聊天吧'}</span>
          {conv.unreadCount > 0 && (
            <span className="ml-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 min-w-[18px] text-center">
              {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

function MessageThread({ conv, convId, onBack }: { conv: ConversationDto; convId: number; onBack: () => void }) {
  const [text, setText] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data: messages = [], isLoading } = useQuery<MessageDto[]>({
    queryKey: ['messages', convId],
    queryFn: () => messageService.listMessages(convId),
    refetchInterval: 60_000,
  });

  const sendMutation = useMutation({
    mutationFn: (body: string) => messageService.sendMessage(convId, body),
    onSuccess: (newMsg) => {
      queryClient.setQueryData<MessageDto[]>(['messages', convId], (prev = []) => [newMsg, ...prev]);
      queryClient.invalidateQueries({ queryKey: ['messages', 'conversations'] });
      setText('');
    },
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSend = () => {
    if (!text.trim() || sendMutation.isPending) return;
    sendMutation.mutate(text.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Reverse messages for display (oldest first)
  const displayMsgs = [...messages].reverse();

  return (
    <>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-white">
        <button onClick={onBack} className="lg:hidden text-gray-400 hover:text-gray-600">
          <ArrowLeft size={20} />
        </button>
        <img
          src={conv.otherAvatar || `https://i.pravatar.cc/150?u=${conv.otherUserId}`}
          className="w-9 h-9 rounded-full object-cover"
          alt={conv.otherNickname}
        />
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-gray-900 text-sm">{conv.otherNickname}</span>
            {conv.otherVerified && <CheckCircle2 size={13} className="text-blue-500 fill-blue-500" />}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-gray-50/50">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                <Skeleton className="h-8 w-40 rounded-2xl" />
              </div>
            ))}
          </div>
        ) : displayMsgs.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-gray-400">发一条消息打个招呼吧</p>
          </div>
        ) : (
          displayMsgs.map((msg) => (
            <MessageBubble key={msg.id} msg={msg} />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-gray-100 bg-white">
        <div className="flex gap-2 items-end">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入消息… (Enter 发送)"
            rows={1}
            className="flex-1 resize-none border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 max-h-32 overflow-y-auto"
            style={{ minHeight: '42px' }}
          />
          <Button
            size="sm"
            className="shrink-0 h-10 px-4"
            onClick={handleSend}
            disabled={!text.trim() || sendMutation.isPending}
          >
            <Send size={15} />
          </Button>
        </div>
      </div>
    </>
  );
}

function MessageBubble({ msg }: { msg: MessageDto }) {
  return (
    <div className={`flex items-end gap-2 ${msg.isMine ? 'justify-end' : 'justify-start'}`}>
      {!msg.isMine && (
        <img
          src={msg.senderAvatar || `https://i.pravatar.cc/150?u=${msg.senderId}`}
          className="w-7 h-7 rounded-full object-cover shrink-0 mb-0.5"
          alt={msg.senderNickname}
        />
      )}
      <div className={`group max-w-[70%]`}>
        <div
          className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words ${
            msg.isMine
              ? 'bg-blue-600 text-white rounded-br-sm'
              : 'bg-white text-gray-800 border border-gray-100 shadow-sm rounded-bl-sm'
          }`}
        >
          {msg.body}
        </div>
        <div className={`text-[10px] text-gray-400 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity ${msg.isMine ? 'text-right' : 'text-left'}`}>
          {msg.sentAt ? formatRelativeTime(msg.sentAt) : ''}
        </div>
      </div>
    </div>
  );
}
