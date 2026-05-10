import AppLayout from "@/components/layout/AppLayout";
import MainHeader from "@/components/layout/MainHeader";
import SectionHeader from "@/components/common/SectionHeader";
import AuthStatus from "@/features/auth/AuthStatus";
import LearningPathCard from "@/components/learn/LearningPathCard";
import EmptyState from "@/components/common/EmptyState";
import styles from "./LearningPage.module.css";
import { useNavigate } from "react-router-dom";

const learningPaths = [
  {
    title: "Java 八股文精讲",
    description: "系统掌握 Java 面试高频知识点，涵盖集合框架、JVM、并发、Spring 等核心模块",
    tags: ["Java", "八股文", "面试"],
    progress: 35,
    postCount: 25,
    searchQuery: "Java 八股文",
  },
  {
    title: "AI/LLM 入门到精通",
    description: "从 Transformer 基础到大模型应用开发，涵盖 Prompt Engineering、RAG、微调等前沿技术",
    tags: ["AI", "LLM", "Transformer"],
    progress: 20,
    postCount: 25,
    searchQuery: "AI LLM",
  },
  {
    title: "Agent 开发实战",
    description: "学习智能体架构设计与开发，掌握 MCP 协议、工具调用、多 Agent 协作等实战技能",
    tags: ["Agent", "MCP", "LangChain"],
    progress: 10,
    postCount: 20,
    searchQuery: "Agent MCP",
  },
];

const LearningPage = () => {
  const navigate = useNavigate();

  return (
    <AppLayout
      header={
        <MainHeader
          headline="我的学习"
          subtitle="记录每一次学习进步，保持持续成长"
          rightSlot={<AuthStatus />}
        />
      }
    >
      <SectionHeader title="学习路径" subtitle="按专题系统学习，高效提升技能" />

      <div className={styles.pathGrid}>
        {learningPaths.map((path, idx) => (
          <LearningPathCard
            key={path.title}
            {...path}
          />
        ))}
      </div>

      <div className={styles.section}>
        <SectionHeader title="我的收藏" subtitle="收藏的优质知文" />
        <EmptyState
          title="暂无收藏"
          description="浏览知文时点击收藏按钮，优质内容不会错过"
          actionLabel="去首页看看"
          onAction={() => navigate('/')}
        />
      </div>
    </AppLayout>
  );
};

export default LearningPage;
