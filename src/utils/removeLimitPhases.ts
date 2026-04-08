/**
 * 一键去控：分阶段专业流程文案（随身 WiFi / 蜂窝 CPE）
 * 与 store 中四阶段 removeLimitPhase（0～3）一一对应
 */
export const REMOVE_LIMIT_PHASES: { title: string; lines: string[] }[] = [
  {
    title: '连接通道',
    lines: [
      '[连接通道] 建立 QMI 与蜂窝模组的 AT 指令隧道；枚举 USB Composite 上的 RNDIS/ECM 数据面与诊断口。',
      '  • 模组标识：IMEI / IMSI / ICCID / EID（eUICC）可读；软 SIM / 远程写卡策略与运营商模板一致。',
      '  • NAS/EPS：PLMN、TAC、ECI 已解析；RSRP/RSRQ/SINR/CQI 在门限内，RRC 为 Connected。',
      '  • 默认 PDN：APN 与签约一致；IPv4v6 双栈或单栈与 HLR 策略匹配；DNS 由 PGW/SMF 下发。',
      '  • 随身 WiFi：USB 供电与热节流正常；2.4/5 GHz 与蜂窝射频共存未触发 SAR/降功率互锁。',
      '  • 管理面：TR-069 / OMA-DM / LwM2M（若启用）会话空闲；本次走本地去控，不抢占用户面 GBR。',
      '  • 时钟与同步：NITZ/SIB 时间戳校验；避免与 WiFi beacon 时隙冲突导致的调度抖动。',
      '  • 链路探测：ICMP/TCP RTT 基线采样，作为去控后对比的参考指纹。',
    ],
  },
  {
    title: '扫描策略',
    lines: [
      '[扫描策略] 枚举承载级 QoS（QCI）、TFT 五元组与 SDF；比对 DPI 限速指纹与 PCC/PCF 规则版本。',
      '  • 热点转发：snat/dnat、conntrack、hairpin、Full Cone；DHCP Option 与租约与 CGNAT 池一致。',
      '  • WiFi 空口：WMM AC/EDCA、802.11k/v/r、BSS 着色；WPA3-SAE / PMF 与访客 VLAN 策略抽检。',
      '  • 达量与策略：本地用量计数器与 OCS 在线配额、OFCA 离线批价窗口对齐；命中「达量降速」PCC 位。',
      '  • 语音与数据：VoLTE/VoNR 专载（QCI1）与默认承载隔离；SIP/RTP ALG 与会话路径无异常。',
      '  • 安全：IPSec 隧道摘要、L2TP/GRE（若存在）与防火墙域间策略；DNS over TLS 与劫持特征扫描。',
      '  • 业务识别：DPI 对 HTTPS SNI / QUIC 初始包分类；识别视频/下载/游戏流并映射到 PCC 业务 ID。',
      '  • 拓扑：检测桥接/路由双栈、IPv6 PD 前缀委托与 NPTv6，避免策略在双栈下错绑。',
    ],
  },
  {
    title: '执行去控',
    lines: [
      '[执行去控] 下发解除限速：刷新本地 PCC 缓存，发起 SMF/PGW（4G）或 SMF/UPF（5G）承载级策略重协商。',
      '  • 承载：默认承载 MBR/GBR、Session-AMBR、UE-AMBR 重置；清除异常 TFT 与限速类 DSCP/PHB 标记。',
      '  • 用户面：GTP-U TEID / PFCP Session 保持；请求 UPF 刷新 QoS Profile 与计费门控，不拆 PDU。',
      '  • 模组：发起 PDU Session Modify / PDP Context Modify（或 AT+QCFG）；维持 IP 与 DNS，降低 TCP 重传风暴。',
      '  • 热点：iptables/nft 热重载、conntrack 保活；UPnP/端口映射与 P2P/视频会议五元组会话保持。',
      '  • 功耗：C-DRX/RRC InactivityTimer 不强制拉长；仅在策略 ACK 窗口微调 DRX 占空比。',
      '  • 容灾：主用 PGW/SMF 不可达时触发备选 S-NSSAI/DNN 回退路径探测（概念）。',
      '  • 观测：用户面 N3/N6 时延与丢包采样，作为去控生效的旁路判据。',
    ],
  },
  {
    title: '同步侧',
    lines: [
      '[同步侧] 轮询 PGW-C/SMF 与 UPF 的 PFCP/GTP 策略 ACK；观测 Gy/Gx/N40 计费与配额刷新。',
      '  • 签约：HSS/UDM 用户模板与 PCF/PCRF 规则一致性；策略版本 ST 递增与订阅变更通知（概念）。',
      '  • 计费：OCS 在线配额、CDF 话单关闭批次与 OFCS 离线对齐；解除限速后拉取下一计费周期门限。',
      '  • 无线：EN-DC 下 MN/SN 承载修改顺序；避免 SCG Failure；NR CA/ENDC 组合带宽策略回写。',
      '  • 本地：RRC 保持；WiFi 侧信道与 beacon 间隔稳定；准备业务面吞吐/抖动/RTT 三联验证。',
      '  • 追溯：去控会话 ID、策略哈希、模组 last error / QMI 日志摘要落盘（概念），便于 BSS/OSS 协查。',
      '  • 核心接口：S5/S8、S11、N4、N11、N40 信令路径健康度轮询（概念）；无异常熔断。',
      '  • 收尾：策略同步窗口关闭；等待设备与核心网最终 ACK，释放本地临界区锁。',
    ],
  },
]
