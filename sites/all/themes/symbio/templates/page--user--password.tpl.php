<?php include ($directory."/partials/login-header.php"); ?>
<main id="login-body" itemscope itemprop="mainContentOfPage" itemtype="http://schema.org/WebPageElement">
  <header class="row column text-center">
    <h1 itemprop="headline"><?php print $title; ?></h1>
  </header>
  <div class="row">
    <div class="medium-6 small-centered columns login-form-box-wrapper">
      <div class="login-form-box text-center">
        <div class="row column">
          <?php print $messages; ?>
        </div>
        <div class="row">
          <?php print render($page['content']); ?>
        </div>
      </div>
    </div>
  </div>
</main>
<?php include ($directory."/partials/login-footer.php"); ?>