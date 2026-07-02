# Slide 05 - Network Versioning and GeoJSON Synchronization

## Slide Title
Bản đồ đường sắt theo phiên bản Network

## NotebookLM Instruction
Explain the network versioning mechanism and how GeoJSON data is imported. This slide should make clear that physical railway infrastructure is separated from commercial routes.

## Main Slide Content
- Dữ liệu bản đồ được import từ GeoJSON gồm điểm ga và đường ray.
- Mỗi lần đồng bộ tạo một bản ghi `Network` mới với `version` tăng dần.
- `Station` và `RailwayLine` gắn với `networkId`, giúp nhiều phiên bản bản đồ cùng tồn tại.
- `RailwayLine.pathCoordinates` lưu các đoạn đường ray vật lý dạng LineString/MultiLineString.
- `Route` là tuyến thương mại do admin tạo, tham chiếu đến một network cụ thể.
- Cách tách này giúp cập nhật bản đồ hạ tầng mà không phá lịch sử route/trip cũ.

## Speaker Notes
Nói rõ sự khác nhau: RailwayLine là đường ray vật lý; Route là tuyến khai thác thương mại gồm thứ tự các ga. Network versioning giúp hệ thống kiểm soát thay đổi dữ liệu hạ tầng theo thời gian.

## Visual Suggestion
- Timeline: Network v1 -> Network v2 -> Network v3.
- Mỗi Network chứa Station/RailwayLine, Route trỏ vào một network.

## Source Evidence
- `api/src/modules/geojson/geojson.service.ts`
- `api/prisma/schema.prisma`
- `network.geojson`

