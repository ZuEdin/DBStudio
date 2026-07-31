import JSZip from "jszip";

export function generateWebhooksController(zip: JSZip) {
  zip.file("Controllers/WebhooksController.cs", `using Microsoft.AspNetCore.Mvc;
using DBStudioBackend.Services;
using System.Text.Json;

namespace DBStudioBackend.Controllers
{
    [ApiController]
    [Route("api/webhooks")]
    public class WebhooksController : ControllerBase {
        private readonly WebhookDispatcher _dispatcher;
        public WebhooksController(WebhookDispatcher dispatcher) => _dispatcher = dispatcher;

        [HttpGet("configs")]
        public IActionResult GetConfigs() => Ok(_dispatcher.GetWebhooks());

        [HttpPost("configs")]
        public IActionResult CreateConfig([FromBody] JsonElement body) {
            string url = body.GetProperty("url").GetString() ?? "";
            string eventName = body.GetProperty("eventName").GetString() ?? "";
            
            var webhook = _dispatcher.RegisterWebhook(url, eventName);
            return StatusCode(201, webhook);
        }

        [HttpDelete("configs/{id}")]
        public IActionResult DeleteConfig(string id) {
            if (_dispatcher.RemoveWebhook(id)) return Ok(new { success = true });
            return NotFound();
        }

        [HttpPost("trigger")]
        public async Task<IActionResult> TriggerWebhook([FromBody] JsonElement body) {
            string eventName = body.TryGetProperty("eventName", out var ev) ? ev.GetString() ?? "table.change" : "table.change";
            var payload = body.TryGetProperty("payload", out var pl) ? pl : default;
            
            var results = await _dispatcher.DispatchAsync(eventName, payload);
            return Ok(new { success = true, dispatchedTo = results.Count, responses = results });
        }
    }
}
`);

  zip.file("Services/WebhookDispatcher.cs", `using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace DBStudioBackend.Services
{
    public class WebhookConfig {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string Url { get; set; } = "";
        public string EventName { get; set; } = "table.change";
        public string Secret { get; set; } = Guid.NewGuid().ToString("n");
        public int IsActive { get; set; } = 1;
    }

    public class WebhookDispatcher {
        private static readonly List<WebhookConfig> _configs = new List<WebhookConfig>();
        private readonly IHttpClientFactory _clientFactory;

        public WebhookDispatcher(IHttpClientFactory clientFactory) {
            _clientFactory = clientFactory;
        }

        public List<WebhookConfig> GetWebhooks() => _configs;

        public WebhookConfig RegisterWebhook(string url, string eventName) {
            var item = new WebhookConfig { Url = url, EventName = eventName };
            _configs.Add(item);
            return item;
        }

        public bool RemoveWebhook(string id) {
            var idx = _configs.FindIndex(x => x.Id == id);
            if (idx >= 0) {
                _configs.RemoveAt(idx);
                return true;
            }
            return false;
        }

        public async Task<List<object>> DispatchAsync(string eventName, JsonElement payload) {
            var results = new List<object>();
            var targets = _configs.FindAll(w => w.EventName == eventName && w.IsActive == 1);

            if (targets.Count == 0) return results;

            var client = _clientFactory.CreateClient();
            var payloadStr = JsonSerializer.Serialize(new {
                Event = eventName,
                Timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
                Data = payload
            });

            foreach (var hook in targets) {
                try {
                    var request = new HttpRequestMessage(HttpMethod.Post, hook.Url) {
                        Content = new StringContent(payloadStr, Encoding.UTF8, "application/json")
                    };
                    request.Headers.Add("X-DBStudio-Signature", hook.Secret);
                    request.Headers.Add("X-DBStudio-Event", eventName);

                    var resp = await client.SendAsync(request);
                    results.Add(new {
                        webhookId = hook.Id,
                        url = hook.Url,
                        status = resp.StatusCode.ToString(),
                        isSuccess = resp.IsSuccessStatusCode
                    });
                } catch (Exception ex) {
                    results.Add(new {
                        webhookId = hook.Id,
                        url = hook.Url,
                        status = "ERROR",
                        error = ex.Message,
                        isSuccess = false
                    });
                }
            }

            return results;
        }
    }
}
`);
}
