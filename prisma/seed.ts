import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // 유저 3명
  const pw = await bcrypt.hash("password123", 12);
  const [ideamaker, writer, finisher] = await Promise.all([
    prisma.user.upsert({
      where: { email: "idea@comuse.io" },
      update: {},
      create: { email: "idea@comuse.io", username: "ideamaker", displayName: "아이디어왕", passwordHash: pw },
    }),
    prisma.user.upsert({
      where: { email: "writer@comuse.io" },
      update: {},
      create: { email: "writer@comuse.io", username: "novelist", displayName: "소설가김씨", passwordHash: pw },
    }),
    prisma.user.upsert({
      where: { email: "finisher@comuse.io" },
      update: {},
      create: { email: "finisher@comuse.io", username: "endingmaster", displayName: "결말장인", passwordHash: pw },
    }),
  ]);

  // 작품 1: 기억 도둑
  const work1 = await prisma.work.create({
    data: {
      title: "기억 도둑",
      logline: "2150년, 기억을 팔아 먹고사는 기억 도둑이 자신의 기억을 훔친 의뢰인을 추적하는 SF 스릴러",
      description: "뇌-인터넷 인터페이스가 보편화된 미래. 기억을 삭제하거나 이식하는 기술이 등장하면서 '기억 브로커'라는 직업이 생겨났다. 주인공 강하늘은 기억 도둑이지만, 어느 날 자신의 소중한 기억이 누군가에게 도난당했다는 것을 알게 된다.",
      genre: "SCREENPLAY",
      tags: ["SF", "스릴러", "기억", "미래", "느와르"],
      status: "OPEN",
      authorId: ideamaker.id,
    },
  });

  const branch1 = await prisma.branch.create({
    data: { name: "main", workId: work1.id, creatorId: ideamaker.id },
  });
  await prisma.work.update({ where: { id: work1.id }, data: { mainBranchId: branch1.id } });

  const seg1 = await prisma.segment.create({
    data: {
      branchId: branch1.id, authorId: ideamaker.id, order: 1, type: "OPENING",
      title: "프롤로그 - 기억의 가격",
      wordCount: 280,
      body: `2150년 서울. 남산타워는 이제 뇌-클라우드 중계탑으로 쓰인다.\n\n강하늘(35)은 골목 끝 낡은 간판 앞에 섰다. '기억클리닉 - 상담 무료'. 그가 운영하는 곳이다. 정확히는 기억을 팔고 싶은 사람과 사고 싶은 사람을 이어주는 브로커.\n\n오늘 의뢰는 특이했다. 의뢰인은 자신의 첫사랑 기억을 팔겠다고 했다. 감정 해상도 97%, 시장가로 2억 크레딧. 강하늘은 별다른 의심 없이 표준 계약서를 꺼냈다.\n\n그것이 함정의 시작이었다.`,
    },
  });

  await prisma.segment.create({
    data: {
      branchId: branch1.id, authorId: writer.id, order: 2, type: "BODY",
      title: "1장 - 빈 서랍",
      wordCount: 340,
      body: `사흘 후, 강하늘은 아침에 눈을 떴다가 멈췄다.\n\n무언가가 없었다. 단어도, 이름도 떠오르지 않았다. 그냥... 구멍.\n\n그는 침대 옆 뉴럴-다이어리를 열었다. 7년 전 항목. 사진 속 여자와 함께 웃고 있는 자신. 이름: 이서연. 관계: 연인. 그런데 얼굴을 봐도 아무것도 느껴지지 않았다. 해상도 제로.\n\n누군가가 그의 기억을 빼갔다.\n\n강하늘은 즉시 뉴럴-로그를 뒤졌다. 접근 기록, 마지막 동기화 시각. 데이터는 지워져 있었다. 완벽하게. 이건 아마추어 솜씨가 아니었다.`,
    },
  });

  // 브랜치 - 결말 분기 (주인공 사망 버전)
  const branch1b = await prisma.branch.create({
    data: {
      name: "비극적 결말 - 하늘의 선택",
      description: "기억을 되찾는 대신 죽음을 선택하는 버전",
      workId: work1.id, creatorId: finisher.id,
      parentBranchId: branch1.id,
      forkedAfterSegmentId: seg1.id,
    },
  });

  await prisma.segment.create({
    data: {
      branchId: branch1b.id, authorId: finisher.id, order: 1, type: "ENDING",
      title: "에필로그 - 마지막 기억",
      wordCount: 210,
      body: `강하늘은 의뢰인의 눈을 바라봤다. 그 눈 속에 자신의 7년이 담겨 있었다.\n\n"돌려줄 수 있어요," 의뢰인이 말했다. "하지만 당신이 가진 다른 모든 기억과 교환해야 해요."\n\n강하늘은 잠시 생각했다. 그리고 웃었다.\n\n"좋아요."\n\n뉴럴-인터페이스가 연결됐다. 차갑고 고요한 빛이 번졌다. 강하늘은 마지막으로 그녀의 이름을 떠올렸다. 서연. 그 이름만큼은 잊고 싶지 않았다.`,
    },
  });

  // 기여도
  await prisma.contributionScore.createMany({
    data: [
      { userId: ideamaker.id, workId: work1.id, percentage: 40, segmentCount: 1, totalWords: 280 },
      { userId: writer.id, workId: work1.id, percentage: 35, segmentCount: 1, totalWords: 340 },
      { userId: finisher.id, workId: work1.id, percentage: 25, segmentCount: 1, totalWords: 210 },
    ],
    skipDuplicates: true,
  });

  // 작품 2: 소재만 있는 것 (집필자 모집 중)
  const work2 = await prisma.work.create({
    data: {
      title: "조선시대 퀀텀 물리학자",
      logline: "현대 물리학자가 조선 중기로 타임슬립해, 양자역학으로 역병을 막으려는 이야기",
      genre: "DRAMA",
      tags: ["사극", "타임슬립", "과학", "판타지"],
      status: "OPEN",
      authorId: ideamaker.id,
    },
  });
  const branch2 = await prisma.branch.create({
    data: { name: "main", workId: work2.id, creatorId: ideamaker.id },
  });
  await prisma.work.update({ where: { id: work2.id }, data: { mainBranchId: branch2.id } });
  await prisma.segment.create({
    data: {
      branchId: branch2.id, authorId: ideamaker.id, order: 1, type: "IDEA",
      title: "소재 아이디어",
      wordCount: 150,
      body: `핵심 소재: 2024년 KAIST 양자물리학 교수가 연구실 사고로 1650년 조선으로 이동. 당시 창궐하던 역병(천연두)을 현대 과학 지식으로 막으려 하지만, 언어·신분·문화 장벽에 부딪힌다.\n\n집필 방향 제안: 과학 설명은 최소화하고 인간관계 중심으로. 조선 의관과의 갈등과 협력이 핵심. 마지막에 주인공이 현대로 돌아갈 기회를 포기하는 결말 원함.\n\n집필 가능한 분 환영합니다!`,
    },
  });
  await prisma.contributionScore.create({
    data: { userId: ideamaker.id, workId: work2.id, percentage: 100, segmentCount: 1, totalWords: 150 },
  });

  // 작품 3: 뮤지컬
  const work3 = await prisma.work.create({
    data: {
      title: "편의점 24시 - 뮤지컬",
      logline: "새벽 3시 편의점을 배경으로, 각자의 이유로 잠 못 드는 사람들이 모여 하룻밤을 보내는 옴니버스 뮤지컬",
      genre: "MUSICAL",
      tags: ["뮤지컬", "옴니버스", "일상", "힐링", "합창"],
      status: "OPEN",
      isFeatured: true,
      authorId: writer.id,
    },
  });
  const branch3 = await prisma.branch.create({
    data: { name: "main", workId: work3.id, creatorId: writer.id },
  });
  await prisma.work.update({ where: { id: work3.id }, data: { mainBranchId: branch3.id } });
  await prisma.segment.create({
    data: {
      branchId: branch3.id, authorId: writer.id, order: 1, type: "OPENING",
      title: "오프닝 넘버 - 새벽 세 시",
      wordCount: 200,
      body: `[무대: 형광등 불빛의 편의점. 카운터에 알바생 민준(22). 손님 없음.]\n\n민준: (멜로디 읊조리며)\n새벽 세 시, 아무도 없는 이 곳에\n형광등만 나를 보고 있어\n삼각김밥 하나, 컵라면 하나\n오늘도 여기서 새벽을 버텨\n\n[문 열리는 소리. 첫 번째 손님 등장 - 수진(38), 정장 차림에 운동화]\n\n수진: (혼잣말) 아직 버스가 없네.\n민준: 어서오세요.\n수진: (진열대 앞에서 멍하니) ...복권 어디 있어요?\n민준: 저쪽이요. (사이) 당첨되셨어요?\n수진: (웃음) 반대요.`,
    },
  });
  await prisma.contributionScore.create({
    data: { userId: writer.id, workId: work3.id, percentage: 100, segmentCount: 1, totalWords: 200 },
  });

  console.log("✅ 시드 완료:", { ideamaker: ideamaker.email, writer: writer.email, finisher: finisher.email });
  console.log("작품:", [work1.title, work2.title, work3.title].join(", "));
}

main().catch(console.error).finally(() => prisma.$disconnect());
