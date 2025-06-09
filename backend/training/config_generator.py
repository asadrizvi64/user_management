from pathlib import Path
from typing import Dict
from slugify import slugify

class ConfigGenerator:
    def generate_config(
        self,
        product_name: str,
        base_model: str,
        trigger_word: str,
        dataset_path: Path,
        training_params: Dict,
        output_path: Path
    ) -> tuple[str, str]:
        """Generate training script and configuration"""
        
        output_name = slugify(product_name)
        output_dir = output_path / output_name
        
        # Generate training script
        training_script = self._generate_training_script(
            base_model=base_model,
            output_name=output_name,
            output_dir=output_dir,
            dataset_path=dataset_path,
            training_params=training_params
        )
        
        # Generate TOML config
        training_config = self._generate_toml_config(
            dataset_path=dataset_path,
            trigger_word=trigger_word,
            training_params=training_params
        )
        
        return training_script, training_config
    
    def _generate_training_script(
        self,
        base_model: str,
        output_name: str,
        output_dir: Path,
        dataset_path: Path,
        training_params: Dict
    ) -> str:
        """Generate the training shell script"""
        
        # This is adapted from FluxGym's gen_sh function
        script = f"""#!/bin/bash
accelerate launch \\
  --mixed_precision bf16 \\
  --num_cpu_threads_per_process 1 \\
  sd-scripts/flux_train_network.py \\
  --pretrained_model_name_or_path "models/unet/flux1-dev.sft" \\
  --clip_l "models/clip/clip_l.safetensors" \\
  --t5xxl "models/clip/t5xxl_fp16.safetensors" \\
  --ae "models/vae/ae.sft" \\
  --cache_latents_to_disk \\
  --save_model_as safetensors \\
  --sdpa --persistent_data_loader_workers \\
  --max_data_loader_n_workers {training_params.get('workers', 2)} \\
  --seed {training_params.get('seed', 42)} \\
  --gradient_checkpointing \\
  --mixed_precision bf16 \\
  --save_precision bf16 \\
  --network_module networks.lora_flux \\
  --network_dim {training_params.get('network_dim', 4)} \\
  --optimizer_type adamw8bit \\
  --learning_rate {training_params.get('learning_rate', '8e-4')} \\
  --cache_text_encoder_outputs \\
  --cache_text_encoder_outputs_to_disk \\
  --fp8_base \\
  --highvram \\
  --max_train_epochs {training_params.get('max_train_epochs', 16)} \\
  --save_every_n_epochs {training_params.get('save_every_n_epochs', 4)} \\
  --dataset_config "{output_dir}/dataset.toml" \\
  --output_dir "{output_dir}" \\
  --output_name {output_name} \\
  --timestep_sampling {training_params.get('timestep_sampling', 'shift')} \\
  --discrete_flow_shift 3.1582 \\
  --model_prediction_type raw \\
  --guidance_scale {training_params.get('guidance_scale', 1.0)} \\
  --loss_type l2
"""
        return script
    
    def _generate_toml_config(
        self,
        dataset_path: Path,
        trigger_word: str,
        training_params: Dict
    ) -> str:
        """Generate the TOML dataset configuration"""
        
        config = f"""[general]
shuffle_caption = false
caption_extension = '.txt'
keep_tokens = 1

[[datasets]]
resolution = {training_params.get('resolution', 512)}
batch_size = 1
keep_tokens = 1

  [[datasets.subsets]]
  image_dir = '{dataset_path}'
  class_tokens = '{trigger_word}'
  num_repeats = {training_params.get('num_repeats', 10)}
"""
        return config