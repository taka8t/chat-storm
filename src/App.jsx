import { useState, useEffect, useRef } from 'react'
import { GoogleGenerativeAI } from "@google/generative-ai";
import Markdown from 'react-markdown';
import './App.css'

function ModelSelector({model_name, onChange}) {
  return (
    <label>
        model: {" "}
        <select
            value={model_name}
            onChange={onChange}
        >
            <option value="gemini-1.0-pro-latest">Gemini 1.0 pro</option>
            <option value="gemini-1.5-flash-latest">Gemini 1.5 Flash</option>
            <option value="gemini-1.5-pro-latest">Gemini 1.5 pro</option>
            <option value="random">Random</option>
        </select>
    </label>
  );
}

function PromptConfig({config, stop, restart, clear, submit}) {
  return (
    <div>
      <div>
        <form method="post" onSubmit={submit}>
          <label>
            Initial Prompt:
            <textarea
              name="initprompt"
              defaultValue={config.init_prompt}
              rows={5}
              cols={40}
            />
          </label>
          <label>
            Prefix Prompt:
            <textarea
              name="prefixprompt"
              defaultValue={config.prefix_prompt}
              rows={5}
              cols={40}
            />
          </label>
          <button type="submit">new chat</button>
        </form>
      </div>
      <hr />
      <div>status: {config.is_running ? "Running": "Stopped"}</div>
      <div>
        <button onClick={restart}>Restart</button>
        <button onClick={stop}>Stop</button>
        <button onClick={clear}>Clear History</button>
      </div>
    </div>
  );
}

function RequestConfig({config, submit}) {
  return (
    <div>
       <form method="post" onSubmit={submit}>
       <label>
            Request Interval (sec):
            <input
              name="interval"
              defaultValue={config.interval}
              pattern='[0-9]+'
            />
        </label>
        <div><button type="submit">Change</button></div>
      </form>
    </div>
  )
}

// markdown変換
function Chat({history}) {
  const postlist = history.map(data => {
    return (
      <li className="post" key={data.id}>
        <div className='model_name'>{data.model}</div>
        <div className='chat_text'><Markdown>{data.text}</Markdown></div>
      </li>
    );
  });
  return (
    <ul>{postlist}</ul>
  );
}

function App() {
  const [modelName, setmodelName] = useState("gemini-1.0-pro-latest");
  const [history, setHistory] = useState([]);
  const [config, setConfig] = useState({
    default_interval: 30000,
    interval: 30000,
    is_running: false,
    init_prompt: "We are now free to control the laws of physics. What will happen to the universe?",
    prefix_prompt: "Please give me your opinion on the above.\n >> {your opinion}"
  });
  
  let models = [];
  let geminiAI;
  let gemini_generationConfig;
  if (import.meta.env.VITE_GEMINI_TOKEN) {
    geminiAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_TOKEN)
    gemini_generationConfig = {
      maxOutputTokens: 500,
      temperature: 0.9,
      topP: 0.95,
      topK: 1,
    };
    models = [...models, "gemini-1.0-pro-latest", "gemini-1.5-flash-latest", "gemini-1.5-pro-latest"];
  }

  if (models.length == 0) {
    return (
      <div>Set your api key to .env.local</div>
    );
  }
  const request_api = async () => {
    let msg = "";
    if (history.length == 0) {
      msg += config.init_prompt
          + "\n\n" 
          + config.prefix_prompt;
    }
    else {
      msg += config.init_prompt 
          + "\n\n" 
          + history.slice(-3).map((data) => data.text).join("\n\n") 
          + "\n\n" 
          + config.prefix_prompt;
    }
    console.log(msg);
    let resp_text = "";
    let next_model = (modelName == "random") ? models[Math.floor(Math.random() * models.length)] : modelName;
    if (next_model.includes("gemini")) {
      const model = geminiAI.getGenerativeModel({model: next_model, gemini_generationConfig});
      await model.generateContent(msg).then(result => {
        resp_text = result.response.text();
      }).catch(err => {
        console.error('error: ', err);
        return;
      });
      // resp_text = next_model + " text" + `${next_model}_${new Date().getTime()}`;
    }
    else {
      // unimplemented
    }
    setHistory((prev) => 
      [...prev, {
        id: `${next_model}_${new Date().getTime()}`,
        model: next_model,
        text: resp_text
      }].slice(-100)
    );
    setConfig((prev) => {return {...prev, interval: prev.default_interval};});
  }

  useEffect(() => {
    const request_handler = setTimeout(() => {
      if (config.is_running) {
        request_api();
      }
    }, config.interval);

    return () => {
      clearTimeout(request_handler);
    };
  }, [modelName, config, history]);

  function handle_prompt_submit(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    if (formData.get("initprompt") == "") return;
    setConfig((prev) => {
      return {
        ...prev,
        interval: 0,
        is_running: true,
        init_prompt: formData.get("initprompt"),
        prefix_prompt: formData.get("prefixprompt")
      }
    });
    setHistory(() => []);
  }

  function handle_request_submit(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    let interval = parseInt(formData.get("interval"), 10);
    setConfig((prev) => {
      return {
        ...prev,
        interval: interval,
        default_interval: interval
      }
    });
  }
  return (
    <div className="main">
      <div className="conf">
        <ModelSelector 
          model_name={modelName}
          onChange={e => setmodelName(e.target.value)}
        />
        <RequestConfig 
          config={config}
          submit={handle_request_submit}
        />
        <PromptConfig
          config={config}
          stop={() => setConfig({...config, is_running: false})}
          restart={() => setConfig({...config, is_running: true})}
          clear={() => setHistory([])}
          submit={handle_prompt_submit} 
        />
      </div>
      <div className="chat">
        <Chat history={history}/>
      </div>
    </div>
  )
}

export default App
