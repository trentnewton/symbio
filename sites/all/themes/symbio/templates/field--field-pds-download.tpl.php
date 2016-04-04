<?php foreach ($items as $delta => $item) : ?>
	<?php
    	print render($item);
    	// Add comma if not last item
    	if ($delta < (count($items) - 1)) {
      		print ',';
    	}
	?>
<?php endforeach; ?>