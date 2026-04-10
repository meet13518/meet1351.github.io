/**
 * 一键去控：分阶段专业流程文案（随身 WiFi / 蜂窝 CPE）
 * 与 store 中四阶段 removeLimitPhase（0～3）一一对应
 */
import type { ConsoleOutputLocale } from '@/types/settings'
import { REMOVE_LIMIT_PHASES_EN } from './removeLimitPhasesEn'

export const REMOVE_LIMIT_PHASES_ZH: { title: string; lines: string[] }[] = [
  {
    title: '连接通道',
    lines: [
      '[连接通道] 建立 QMI 与蜂窝模组的 AT 指令隧道；枚举 USB Composite 上的 RNDIS/ECM 数据面与诊断口；校验 USB 描述符与 bInterfaceClass 绑定。',
      '  • 模组标识：IMEI / IMSI / ICCID / EID（eUICC）可读；软 SIM / 远程写卡策略与运营商模板一致；SUPI/SUCI 与 5G-GUTI 映射可查。',
      '  • NAS/EPS：PLMN、TAC、ECI 已解析；RSRP/RSRQ/SINR/CQI 在门限内，RRC 为 Connected；TAU/RAU 与寻呼周期与当前 MME/AMF 策略一致。',
      '  • 默认 PDN：APN 与签约一致；IPv4v6 双栈或单栈与 HLR/HSS 策略匹配；DNS 由 PGW/SMF 下发；PCO/Protocol Configuration Options 无异常 IE。',
      '  • PDU Session（5G）：S-NSSAI、DNN、SSC mode、URSP 规则与本地路由表对齐；IPv6 RA / DHCPv6 IA_PD 与 SMF 前缀一致。',
      '  • 随身 WiFi：USB 供电与热节流正常；2.4/5 GHz 与蜂窝射频共存未触发 SAR/降功率互锁；DFS 与雷达检测信道避让记录抽检。',
      '  • 管理面：TR-069 / OMA-DM / LwM2M（若启用）会话空闲；本次走本地去控，不抢占用户面 GBR；OMADM 与 USIM OTA 通道互斥策略满足。',
      '  • 时钟与同步：NITZ/SIB 时间戳校验；避免与 WiFi beacon 时隙冲突导致的调度抖动；PTP/gPTP（若透传）与蜂窝侧时基偏差在容限内。',
      '  • 链路探测：ICMP/TCP RTT 基线采样，作为去控后对比的参考指纹；Path MTU 发现与 TCP MSS clamp 与核心侧一致。',
      '  • RRC/AS：SRB/DRB 映射、PDCP SN、RLC AM/UM 模式与 bearer 配置抽检；无异常 RLC 重传风暴与 HARQ NACK 堆积。',
      '  • NG-RAN：BWP、CORESET、搜索空间与 DCI 格式与当前 band/numerology 匹配；SRS/CSI 上报周期与链路自适应正常。',
      '  • 安全：AKA/5G-AKA、RES*、KDF 派生密钥状态正常；空口完整性/机密性算法与运营商策略一致；无异常鉴权重试计数。',
      '  • 诊断口：QMI NAS/WDAN/WDS/WMS 服务可用；diag 与 QMI 并发访问不阻塞用户面；USB 批量传输与 NCM 帧聚合参数在厂商白名单内。',
      '  • 省电：PSM/eDRX（若签约）与当前业务模型兼容；RRC InactivityTimer 与 T3324/T3412 不导致意外 detach。',
      '  • 语音回落：EPS FB / VoNR / SRVCC（若适用）注册态与 IMS P-CSCF 可达性抽检；SIP 注册与 RTP 端口预留无冲突。',
      '  • WiFi 侧：SoftAP 与 STA 共存模式；hostapd/驱动与内核 cfg80211 接口版本匹配；桥接 STP/RSTP 与蜂窝 NAT 域隔离。',
      '  • 统计：RRC 连接时长、RLF、重建立、小区重选计数与近 24h 基线无突变；异常计数写入本地环形缓冲供后续对比。',
      '  • 链路探测：Traceroute 与 TCP 三次握手时延分布；ECN/CUBIC/BBR（若启用）与拥塞窗口初值符合模组侧策略。',
      '  • 收尾：本地管理通道锁与 QMI 事务 ID 对齐；准备进入策略扫描阶段，释放只读诊断句柄。',
    ],
  },
  {
    title: '扫描策略',
    lines: [
      '[扫描策略] 枚举承载级 QoS（QCI/5QI）、TFT 五元组与 SDF；比对 DPI 限速指纹与 PCC/PCF 规则版本；拉取 PCEF/TDF 侧预定义规则表。',
      '  • 热点转发：snat/dnat、conntrack、hairpin、Full Cone；DHCP Option 与租约与 CGNAT 池一致；SYN proxy 与 nf_conntrack_tcp 超时与业务匹配。',
      '  • WiFi 空口：WMM AC/EDCA、802.11k/v/r、BSS 着色；WPA3-SAE / PMF 与访客 VLAN 策略抽检；MU-MIMO/OFDMA 调度与 airtime fairness 记录。',
      '  • 达量与策略：本地用量计数器与 OCS 在线配额、OFCA 离线批价窗口对齐；命中「达量降速」PCC 位；RG 与 Service-Identifier 映射一致。',
      '  • 语音与数据：VoLTE/VoNR 专载（QCI1/5QI2）与默认承载隔离；SIP/RTP ALG 与会话路径无异常；RTCP XR 与 MOS 估算门限抽检。',
      '  • 安全：IPSec 隧道摘要、L2TP/GRE（若存在）与防火墙域间策略；DNS over TLS 与劫持特征扫描；TLS 1.3 ECH / ESNI 指纹与 DPI 白名单。',
      '  • 业务识别：DPI 对 HTTPS SNI / QUIC 初始包分类；识别视频/下载/游戏流并映射到 PCC 业务 ID；App-ID 与 SDF 优先级冲突检测。',
      '  • 拓扑：检测桥接/路由双栈、IPv6 PD 前缀委托与 NPTv6，避免策略在双栈下错绑；ULA/GUA 与源地址选择策略（RFC 6724）一致。',
      '  • PCC 规则：Charging-Rule-Name、Precedence、Flow-Status、QoS-Information 与本地缓存 diff；动态规则与预定义规则合并顺序正确。',
      '  • 计费：Gy/Ro、Gx/N7、N40 会话级与业务级配额计数器对齐；Quota-Consumption 与 Rating-Group 切换无漂移；FUI/FUA 与重授权窗口正常。',
      '  • 限速形态：色盲/色敏感 Policer、Shaper、HQoS 层级与父/子队列绑定；令牌桶 CBS/EBS 与 PIR/CIR 与签约一致。',
      '  • 核心侧：SPR/UDR 中用户策略集版本；PCF 决策订阅与 UE Policy / ANDSP 容器（若启用）无过期 ST。',
      '  • 热点 ACL：iptables/nft 链优先级与 zone 模型；mangle 与 raw 表打标与会话跟踪一致性；IPv6 ip6tables/nft 双栈规则对称。',
      '  • 组播/广播：IGMP/MLD snooping、querier 与 MLDv2；SSM 与 PIM-SM（若透传）与蜂窝侧多播策略隔离。',
      '  • DPI 旁路：ERSPAN/TAP 镜像口与采样率；Zeek/Suricata 特征库版本戳；无异常 bypass 导致策略黑洞。',
      '  • HTTP/3：QUIC connection ID 迁移与 NAT rebinding；0-RTT 与重放窗口策略；ALT-SVC 与 H2 降级路径抽检。',
      '  • 游戏/实时：UDP 会话短流与长流分类；ECN 与 DSCP 重标记与无线侧 L4S（若存在）兼容性。',
      '  • 本地策略：厂商「智能省电/夜间限速」与运营商 PCC 叠加顺序；本地白名单包名与 DPI 结论交叉验证。',
      '  • 输出：生成策略差异向量与限速置信度评分；标记待解除的 Charging-Rule 与 QoS 参数集合，供执行阶段下发。',
    ],
  },
  {
    title: '执行去控',
    lines: [
      '[执行去控] 下发解除限速：刷新本地 PCC 缓存，发起 SMF/PGW（4G）或 SMF/UPF（5G）承载级策略重协商；构造 CCR/CCA 与 Nchf/N40 关联更新。',
      '  • 承载：默认承载 MBR/GBR、Session-AMBR、UE-AMBR 重置；清除异常 TFT 与限速类 DSCP/PHB 标记；Reflective QoS（5G）与 QFI 映射回写。',
      '  • 用户面：GTP-U TEID / PFCP Session 保持；请求 UPF 刷新 QoS Profile 与计费门控，不拆 PDU；N3/N9 接口 F-TEID 与 UPF 选择不变。',
      '  • 模组：发起 PDU Session Modify / PDP Context Modify（或 AT+QCFG）；维持 IP 与 DNS，降低 TCP 重传风暴；RRC Reconfiguration 与 AS security 上下文不变。',
      '  • 热点：iptables/nft 热重载、conntrack 保活；UPnP/端口映射与 P2P/视频会议五元组会话保持；conntrack event 与 expectation 无异常 flush。',
      '  • 功耗：C-DRX/RRC InactivityTimer 不强制拉长；仅在策略 ACK 窗口微调 DRX 占空比；避免 PSM 进入导致会话挂起。',
      '  • 容灾：主用 PGW/SMF 不可达时触发备选 S-NSSAI/DNN 回退路径探测（概念）；PFCP Association/Heartbeat 与 N4 接口冗余状态机正常。',
      '  • 观测：用户面 N3/N6 时延与丢包采样，作为去控生效的旁路判据；TWAMP/STAMP（若启用）与 UPF PM 计数器对齐。',
      '  • N4 PFCP：Session Modification Request 携带 FAR/BAR/QER/URR 更新集；Apply Action 与 Outer Header Creation 与下行分流一致。',
      '  • Gy：CCR-Update 携带 Used-Service-Unit、Reporting-Reason、QoS-Information；Rating-Group 切换与 Multi-Services-Credit-Control 块顺序正确。',
      '  • Gx/N7：CC-Request-Type、Event-Trigger、Charging-Rule-Report 与 PCF 决策回执对齐；无异常 DIAMETER/NAS 超时。',
      '  • 无线侧：NGAP PDU Session Resource Modify / E-RAB Modify 与 QoS flow 映射；DRB 重配置与 PDCP discardTimer 不导致应用层断流。',
      '  • 热点 QoS：cake/fq_codel/htb 层级卸载或旁路；DSCP 与 skb mark 与 conntrack 标记三元一致。',
      '  • IPv6：分段路由（SRv6）与 vanilla IPv6 路径选择；HOP LIMIT 与 PMTU 与核心侧一致；临时地址与稳定地址策略不冲突。',
      '  • 安全：IPsec CHILD_SA 与 PFCP 保护；TLS 会话与 OCSP staple 无过期；本地私钥与 TPM/TEE（若存在）句柄不泄漏。',
      '  • 追溯：去控事务 ID、规则版本向量、时间戳写入本地审计缓冲；与 BSS 侧工单号（概念）可选关联。',
      '  • 回滚：预置「失败则恢复上一版 PCC 快照」的本地影子表；两阶段提交：先 dry-run 再 commit。',
      '  • 观测：对关键五元组发起短时 iperf3 探测（概念）与被动 span 对比；异常则中止提交并告警。',
      '  • 收尾：向同步侧轮询线程投递「策略已提交」事件；释放 QMI 独占锁，等待核心网 ACK。',
    ],
  },
  {
    title: '同步侧',
    lines: [
      '[同步侧] 轮询 PGW-C/SMF 与 UPF 的 PFCP/GTP 策略 ACK；观测 Gy/Gx/N40 计费与配额刷新；Nchf_ConvergedCharging 话单关闭批次。',
      '  • 签约：HSS/UDM 用户模板与 PCF/PCRF 规则一致性；策略版本 ST 递增与订阅变更通知（概念）；UDM Nudm_SDM / Nudr_DR 读一致性窗口内。',
      '  • 计费：OCS 在线配额、CDF 话单关闭批次与 OFCS 离线对齐；解除限速后拉取下一计费周期门限；CDR 字段 Service-Condition-Change 标记更新。',
      '  • 无线：EN-DC 下 MN/SN 承载修改顺序；避免 SCG Failure；NR CA/ENDC 组合带宽策略回写；B1/B2 测量与 A2 去活门限与移动性策略一致。',
      '  • 本地：RRC 保持；WiFi 侧信道与 beacon 间隔稳定；准备业务面吞吐/抖动/RTT 三联验证；ARP/ND 与网关可达性无黑洞。',
      '  • 追溯：去控会话 ID、策略哈希、模组 last error / QMI 日志摘要落盘（概念），便于 BSS/OSS 协查；与 CHR/CEM 关联键一致。',
      '  • 核心接口：S5/S8、S11、N4、N11、N40 信令路径健康度轮询（概念）；无异常熔断；DIAMETER 路由与 realm 解析正确。',
      '  • 收尾：策略同步窗口关闭；等待设备与核心网最终 ACK，释放本地临界区锁；PFCP Session Report 与 Usage Report 闭合。',
      '  • UPF：Buffering / DL Data Notification / End Marker 与顺序交付；在途报文排空后再切换 QoS 标记，避免乱序。',
      '  • SMF：PDU Session SM Context 与 UPF 绑定版本号递增；N4 Session Report 与 Charging ID 更新与 CHF 对齐。',
      '  • AMF/MME：UE reachability、Paging、Service Request 与寻呼策略在去控后无异常风暴；N2/NGAP 释放与重建计数正常。',
      '  • PCRF/PCF：Policy Counter / Session Rule 与 PCC Rule 安装报告；Abort/NACK 原因值解析与重试退避。',
      '  • 计费关闭：Gy CCA 中 Final-Unit-Indication 与配额耗尽处理；N40 ConsumptionReport 与 ChargingData 一致性校验。',
      '  • 无线侧：RRC Release with Redirect / IRAT 与策略刷新竞态检测；重选优先级与 SIB 广播与去控后业务模型兼容。',
      '  • WiFi：CSA/DFS 与蜂窝并发时的信道切换日志；客户端漫游与 OKC/802.11r 与 TCP 会话连续性抽检。',
      '  • 观测：对比去控前后同业务五元组吞吐曲线；异常长尾与重传率门限；写入本地摘要供用户侧展示。',
      '  • 合规：个人数据与信令轨迹最小化留存；日志脱敏与可配置保留周期；可选上传至运营商 BSS（概念）需用户授权标记。',
      '  • 会话收尾：释放审计缓冲；将 removeLimit 结果码与策略版本写入持久化记录表；供首页历史表格展示。',
      '  • 完成：核心网与终端侧状态机回到 IDLE/CONNECTED 稳态；向 UI 层上报「可验证测速」就绪标志。',
    ],
  },
]

/** @deprecated 使用 getRemoveLimitPhases(locale) */
export const REMOVE_LIMIT_PHASES = REMOVE_LIMIT_PHASES_ZH

export function getRemoveLimitPhases(locale: ConsoleOutputLocale) {
  return locale === 'en' ? REMOVE_LIMIT_PHASES_EN : REMOVE_LIMIT_PHASES_ZH
}
