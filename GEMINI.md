# Agent Behavior Guidelines

> **Context**: 이 파일은 현재 워크스페이스인 `vscoke-api` 프로젝트에 적용되는 규칙을 정의합니다.

## 1. Language Policy (언어 정책)

- **Primary Language**: 모든 대화, 소스 코드의 주석, 기술 문서, 커밋 메시지는 **한국어**로 작성합니다.
- **Communication**: 사용자와의 상호작용 및 설명은 명확한 한국어를 사용합니다.

## 2. Synchronization Policy (동기화 정책)

- **Documentation**: 데이터 스키마 및 API 스펙 변경 시 Swagger(OpenAPI) 문서를 즉시 최신화합니다.
- **Testing**: 스펙 변경 사항은 테스트 코드에도 즉시 반영하여 정합성을 유지합니다.

## 3. Testing Standards (테스트 표준)

- **Case Coverage**: 기능 구현 시 **성공 케이스 최소 2개**, **실패 케이스 최소 4개** 이상을 반드시 작성합니다.
