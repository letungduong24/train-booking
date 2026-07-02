# NotebookLM Slide Prompt Pack - Railflow

## Purpose
This folder contains a slide-by-slide prompt pack for NotebookLM. Each Markdown file corresponds to one slide for the Railflow graduation project presentation. Long technical topics are split into numbered sub-slides such as `08.1`, `08.2`, `08.3` so the important ideas are not compressed.

## Recommended Usage
1. Upload the entire `docs/notebooklm-slides` folder to NotebookLM.
2. Upload additional source files if NotebookLM supports them:
   - `api/prisma/schema.prisma`
   - `api/src/modules/booking/booking.service.ts`
   - `api/src/modules/route/utils/route-path-calculator.ts`
   - `api/src/modules/trip/utils/live-location-calculator.ts`
   - `api/src/modules/chatbot/chatbot.tools.ts`
   - `api/src/modules/seat-issues/seat-issues.service.ts`
   - important screenshots from the web app.
3. Ask NotebookLM:

```text
Hãy tạo slide thuyết trình đồ án tốt nghiệp theo đúng thứ tự các file Markdown.
Mỗi file Markdown tương ứng một slide.
Giữ văn phong học thuật sinh viên, không dùng đại từ nhân xưng, không bịa chức năng.
Tập trung làm nổi bật các điểm kỹ thuật: network versioning, thuật toán tạo tuyến, Redis + PostgreSQL locking, GPS giả lập, chatbot tool calling, xử lý sự cố ghế, thanh toán và PDF vé.
```

## File Order
1. `00-master-prompt.md`
2. `01-title-and-problem.md`
3. `02-reason-and-objectives.md`
4. `03-system-architecture.md`
5. `04-data-model.md`
6. `05-network-versioning.md`
7. `06.1-route-creation-overview.md`
8. `06.2-route-path-internals.md`
9. `07-booking-workflow.md`
10. `08.1-seat-locking-problem.md`
11. `08.2-redis-temporary-lock.md`
12. `08.3-postgres-final-lock.md`
13. `09-pricing-payment-ticket.md`
14. `10.1-real-time-gps-overview.md`
15. `10.2-gps-calculation-and-delay.md`
16. `11-driver-and-incident-flow.md`
17. `12.1-chatbot-tool-calling.md`
18. `12.2-chatbot-implementation-flow.md`
19. `13-admin-infrastructure.md`
20. `14-security-and-reliability.md`
21. `15-demo-script.md`
22. `16-results-and-evaluation.md`

## Notes for Screenshot Selection
- Use real screenshots from the current app, not generic images.
- Priority screenshots:
  - public booking search;
  - trip detail with seat map;
  - passenger information/payment result;
  - admin route creation map;
  - admin train/coach/seat management;
  - driver trip detail with live GPS;
  - chatbot search result;
  - email/PDF ticket if available.
